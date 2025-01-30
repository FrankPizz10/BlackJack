import { Card } from './Card';
import { Deck } from './Deck';
import { Hand, computeHandCount } from './Hand';
import { Seat } from './Seat';
import { Action } from './Action';

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
};

//TODO: add support for what happens once roundOver = True triggers

// Helper method for "Hit"
const handleHit = (gs: GameState, seat: number, current_hand: number): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = deck.draw();

  if (card) {
    hand.cards.push(card);
    gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
  }

  const count = computeHandCount(hand);
  if (count >= 21) {
    hand.is_done = true;
  }

  gs.seats[seat].hands[current_hand] = hand;
  return hand.is_done;
};

// Helper method for "Stay"
const handleStay = (gs: GameState, seat: number, current_hand: number): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  hand.is_done = true;
  gs.seats[seat].hands[current_hand] = hand;
  return true;
};

// Helper method for "Double Down"
const handleDoubleDown = (gs: GameState, seat: number, current_hand: number): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = deck.draw();

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
const handleSplit = (gs: GameState, seat: number, current_hand: number): boolean => {
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

// Main method: take_action
export const take_action = (gs: GameState, action: Action): GameState => {
  const seat = gs.seats.findIndex((s) => s.seat_turn);
  if (seat === -1) return gs; // No active seat

  const current_hand = gs.seats[seat].hands.findIndex((h) => h.is_current_hand);
  if (current_hand === -1) return gs; // No current hand

  let is_done = false;

  switch (action) {
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
      is_done = handleHit(gs, seat, current_hand); // Deal action performs two hits
      break;
  }

  if (is_done) {
    gs.seats[seat].hands[current_hand].is_current_hand = false;

    if (seat === gs.seats.length - 1) {
      gs.roundOver = true;
    } else {
      gs.seats[seat].seat_turn = false;
      gs.seats[seat + 1].seat_turn = true;
    }
  }

  return gs;
};
