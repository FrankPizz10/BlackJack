import { Card } from './Card';
import { Deck, draw } from './Deck';
import { Hand, computeHandCount } from './Hand';
import { Seat } from './Seat';
import { Action } from './Action';
import { Bet } from './Bet';
import { StartGame } from './db/Game';

// GameState.ts will be stored in Redis Cache
// Redis Key for the Gamestate will look like Game:{roomId}
export type GameState = {
  rommDbId: number;
  gameTableDbId: number;
  dealerHand: Card[];
  seats: Seat[]; // Always 7 seats
  roundOver: boolean;
  timeToAct: number;
  timeToBet: number;
  deck: Deck;
  bet: Bet | null;
};

// Helper method to check eligible actions for a Seat
export const check_eligible_action = (seat: Seat): Action[] => {
  const hand = seat.hands.find((h) => h.is_current_hand);
  if (!hand) return [];

  const total = computeHandCount(hand.cards);
  const actions: Action[] = [];

  if (total === 21) return actions; // No actions allowed if hand is 21

  // Allow Hit and Stand for all hands under 21
  if (total < 21) {
    actions.push('Hit', 'Stand');
  }

  // Allow Split if hand has two of the same card and the player has enough stack
  if (
    hand.cards.length === 2 &&
    hand.cards[0].card === hand.cards[1].card &&
    seat.player.stack >= hand.bet
  ) {
    actions.push('Split');
  }

  // Allow Double Down if the hand total is 9, 10, 11 (without an Ace) or 16-18 (with an Ace) and the player has enough stack
  const hasAce = hand.cards.some((card) => card.card === 'A');
  if (
    ((!hasAce && [9, 10, 11].includes(total)) ||
      (hasAce && [16, 17, 18].includes(total))) &&
    seat.player.stack >= hand.bet
  ) {
    actions.push('Double Down');
  }

  return actions;
};

// Helper method to handle Dealer action
const handleDealer = (gs: GameState): boolean => {
  let dealerTotal = computeHandCount(gs.dealerHand);
  let hasAce = gs.dealerHand.some((card) => card.card === 'A');
  const deck = gs.deck;

  while (dealerTotal <= 16 || (dealerTotal === 17 && hasAce)) {
    const card = draw(deck);
    if (card) {
      gs.dealerHand.push(card);
      gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
    }
    dealerTotal = computeHandCount(gs.dealerHand);
    hasAce = gs.dealerHand.some((card) => card.card === 'A');
  }
  return false;
};

// Helper method to check the outcome of a hand
const handleCheckHand = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  const dealerTotal = computeHandCount(gs.dealerHand);
  const playerTotal = computeHandCount(hand.cards);
  const hasWon = playerTotal >= dealerTotal;

  if (gs.seats[seat].hands.length > current_hand + 1) {
    gs.seats[seat].hands[current_hand + 1].is_current_hand = true;
    gs.seats[seat].player.stack += hasWon ? 2 * hand.bet : 0;
    gs.seats[seat].hands.splice(current_hand, 1);
  } else {
    const nextSeat = gs.seats.findIndex((s, i) => i > seat && !s.is_afk);
    if (nextSeat !== -1) {
      gs.seats[nextSeat].hands[0].is_current_hand = true;
    }
    hand.cards = [];
    hand.is_current_hand = false;
    gs.seats[seat].player.stack += hasWon ? 2 * hand.bet : 0;
    hand.bet = 0;
  }
  return false;
};

// Helper method for "Hit"
const handleHit = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = draw(deck);

  if (card) {
    hand.cards.push(card);
    gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
  }

  const count = computeHandCount(hand.cards);
  if (count >= 21) {
    hand.is_done = true;
  }

  gs.seats[seat].hands[current_hand] = hand;
  return hand.is_done;
};

// Helper method for "Stay"
const handleStay = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  hand.is_done = true;
  gs.seats[seat].hands[current_hand] = hand;
  return true;
};

// Helper method for "Double Down"
const handleDoubleDown = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = draw(deck);

  if (card) {
    hand.cards.push(card);
    gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
  }

  hand.is_done = true;
  hand.bet *= 2;
  gs.seats[seat].player.stack -= hand.bet / 2;
  gs.seats[seat].hands[current_hand] = hand;
  return true;
};

// Helper method for "Split"
const handleSplit = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  gs.seats[seat].hands.splice(current_hand, 1);

  const [card1, card2] = hand.cards;
  const newHand1: Hand = {
    cards: [card1],
    bet: hand.bet,
    is_current_hand: true,
    is_done: false,
  };
  const newHand2: Hand = {
    cards: [card2],
    bet: hand.bet,
    is_current_hand: false,
    is_done: false,
  };

  gs.seats[seat].hands.push(newHand1, newHand2);
  gs.seats[seat].player.stack -= hand.bet;
  return false;
};

// Helper method to handle Bet action
const handleBet = (gs: GameState): boolean => {
  if (!gs.bet) return false;

  gs.seats[gs.bet.bettingSeat].hands[0].bet = gs.bet.betAmount;

  return false;
};

// Main method: take_action
export const take_action = (gs: GameState, action: Action): GameState => {
  const seat = gs.seats.findIndex((s) => s.seat_turn);
  if (seat === -1) return gs; // No active seat

  const current_hand = gs.seats[seat].hands.findIndex((h) => h.is_current_hand);
  if (current_hand === -1) return gs; // No current hand

  let is_done = false;

  switch (action) {
    case 'Bet':
      is_done = handleBet(gs);
      break;
    case 'Hit':
      is_done = handleHit(gs, seat, current_hand);
      break;
    case 'Stand':
      is_done = handleStay(gs, seat, current_hand);
      break;
    case 'Double Down':
      is_done = handleDoubleDown(gs, seat, current_hand);
      break;
    case 'Split':
      is_done = handleSplit(gs, seat, current_hand);
      break;
    case 'Deal':
      is_done = handleHit(gs, seat, current_hand);
      break;
    case 'CheckHand':
      is_done = handleCheckHand(gs, seat, current_hand);
      break;
    case 'Dealer':
      is_done = handleDealer(gs);
      break;
  }

  if (is_done) {
    gs.seats[seat].hands[current_hand].is_current_hand = false;
    gs.seats[seat].seat_turn = false;

    if (seat === gs.seats.length - 1) {
      gs.roundOver = true;
    } else {
      gs.seats[seat + 1].seat_turn = true;
    }
  }

  return gs;
};

export const createNewGameState = (startGame: StartGame): GameState => {
  return {
    rommDbId: startGame.roomDb.id,
    gameTableDbId: startGame.roomDb.gameTableId,
    dealerHand: [],
    seats: [
      {
        hands: [],
        seat_turn: true,
        is_afk: false,
        player: {
          user_ID: startGame.userRoomDb.userId,
          stack: 100,
          userRoomDbId: startGame.roomDb.id,
          gameTableDbId: startGame.roomDb.gameTableId,
        },
      },
    ],
    roundOver: false,
    timeToAct: 20,
    timeToBet: 15,
    deck: { currentDeck: [], baseDeck: [], numDecks: 1 },
    bet: null,
  };
};
