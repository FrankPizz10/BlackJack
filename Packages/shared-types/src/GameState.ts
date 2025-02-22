import { Card } from './Card';
import { createDeck, Deck, draw, shuffle } from './Deck';
import { Hand, computeHandCount } from './Hand';
import { Seat } from './Seat';
import { ActionType } from './ActionType';
import { Action } from './Action';
import { Bet } from './Bet';
import { Player } from './Player';
import { RoomWithUsersAndSeats, UserRoomWithSeat } from './db/UserRoom';

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
  shuffle: boolean;
};

const drawCard = (deck: Deck, gs: GameState): Card | null => {
  let card = draw(deck);
  if (card && card.suit === 'CUT') {
    gs.shuffle = true;
    card = draw(deck);
  }
  return card;
};

// Helper method to check eligible actions for a Seat
export const checkEligibleAction = (gs: GameState): ActionType[] => {
  const seat = gs.seats[gs.seats.findIndex((s) => s.isTurn)];
  const hand = seat.hands.find((h) => h.isCurrentHand);
  if (!hand) return [];

  const total = computeHandCount(hand.cards);
  const actions: ActionType[] = [];

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
export const handleDealer = (gs: GameState): boolean => {
  // Flip the first card of the dealer
  gs.dealerHand[1].faceUp = true;
  let dealerTotal = computeHandCount(gs.dealerHand);
  let hasAce = gs.dealerHand.some((card) => card.card === 'A');
  const deck = gs.deck;

  while (dealerTotal <= 16 || (dealerTotal === 17 && hasAce)) {
    const card = drawCard(deck, gs);
    if (card) {
      gs.dealerHand.push({ ...card, faceUp: true });
      gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
    }
    dealerTotal = computeHandCount(gs.dealerHand);
    hasAce = gs.dealerHand.some((card) => card.card === 'A');
  }
  return false;
};

// Helper method to check the outcome of a hand
export const handleCheckHand = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  const dealerTotal = computeHandCount(gs.dealerHand);
  const playerTotal = computeHandCount(hand.cards);
  const hasWon = playerTotal >= dealerTotal;

  if (gs.seats[seat].hands.length > current_hand + 1) {
    gs.seats[seat].hands[current_hand + 1].isCurrentHand = true;
    gs.seats[seat].player.stack += hasWon ? 2 * hand.bet : 0;
    gs.seats[seat].hands.splice(current_hand, 1);
  } else {
    const nextSeat = gs.seats.findIndex((s, i) => i > seat && !s.isAfk);
    if (nextSeat !== -1) {
      gs.seats[nextSeat].hands[0].isCurrentHand = true;
    }
    hand.cards = [];
    hand.isCurrentHand = false;
    gs.seats[seat].player.stack += hasWon ? 2 * hand.bet : 0;
    hand.bet = 0;
  }
  return false;
};

// Helper method for "Hit"
export const handleHit = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = drawCard(deck, gs);
  if (card) {
    hand.cards.push({ ...card, faceUp: true });
    gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
  }

  const count = computeHandCount(hand.cards);
  if (count >= 21) {
    hand.isDone = true;
  }
  return hand.isDone;
};

// Helper method for "Stay"
export const handleStay = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const hand = gs.seats[seat].hands[current_hand];
  hand.isDone = true;
  gs.seats[seat].hands[current_hand] = hand;
  return true;
};

// Helper method for "Double Down"
export const handleDoubleDown = (
  gs: GameState,
  seat: number,
  current_hand: number
): boolean => {
  const deck = gs.deck;
  const hand = gs.seats[seat].hands[current_hand];
  const card = drawCard(deck, gs);
  if (card) {
    hand.cards.push(card);
    gs.deck = { ...gs.deck, currentDeck: deck.currentDeck };
  }
  hand.isDone = true;
  hand.bet *= 2;
  gs.seats[seat].player.stack -= hand.bet / 2;
  return true;
};

// Helper method for "Split"
export const handleSplit = (
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
    isCurrentHand: true,
    isDone: false,
  };
  const newHand2: Hand = {
    cards: [card2],
    bet: hand.bet,
    isCurrentHand: false,
    isDone: false,
  };

  gs.seats[seat].hands.push(newHand1, newHand2);
  gs.seats[seat].player.stack -= hand.bet;
  return false;
};

// Helper method to handle Bet action
export const handleBet = (gs: GameState, bet: Bet): boolean => {
  if (!gs || !bet) return false;

  const seatPosition = bet.bettingSeat;
  if (!gs.seats[seatPosition].player) {
    console.error('Player not found at position', seatPosition);
    return false;
  }

  if (bet.betAmount > gs.seats[seatPosition].player.stack) {
    console.log('Not enough stack');
    return false;
  }

  // Update the hand
  gs.seats[seatPosition].hands[0].bet = bet.betAmount;

  // Deduct the bet amount from the player's stack
  gs.seats[seatPosition].player.stack -= bet.betAmount;

  return true;
};

const handleReset = (gs: GameState): void => {
  gs.seats.forEach((seat: Seat, seatIndex) => {
    seat.hands.forEach((hand: Hand) => {
      hand.isDone = false;
      hand.cards = [];
      hand.isCurrentHand = true;
      hand.isBlackjack = false;
      hand.isDone = false;
      hand.isPush = false;
      hand.isWon = false;
      hand.bet = 0;
    });
    seat.isTurn = seatIndex === 0;
  });
  gs.roundOver = false;
  gs.dealerHand = [];
};

export interface ActionResult {
  gs: GameState;
  actionSuccess: boolean;
}

// Main method: take_action
export const takeAction = (gs: GameState, action: Action): ActionResult => {
  console.log('Starting Action: ', action);

  if (action.actionType === 'Bet' && action.bet) {
    handleBet(gs, action.bet);
    return { gs, actionSuccess: true };
  }

  if (action.actionType === 'Reset') {
    handleReset(gs);
    return { gs, actionSuccess: true };
  }

  const seat = gs.seats.findIndex((s) => s.isTurn);
  if (seat === -1) return { gs, actionSuccess: false }; // No active seat

  const elligbleActions = checkEligibleAction(gs);
  console.log('Eligible Action Types: ', elligbleActions);
  if (!elligbleActions.includes(action.actionType)) {
    return { gs, actionSuccess: false };
  }
  console.log('Eligible Action: ', action);
  const current_hand = gs.seats[seat].hands.findIndex((h) => h.isCurrentHand);
  if (current_hand === -1) return { gs, actionSuccess: false }; // No current hand
  console.log('Current Hand: ', gs.seats[seat].hands[current_hand]);
  let is_done = false;
  switch (action.actionType) {
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
    case 'ForceShuffle':
      gs.shuffle = true;
      break;
  }

  if (is_done) {
    gs.seats[seat].hands[current_hand].isCurrentHand = false;
    gs.seats[seat].isTurn = false;

    if (seat === gs.seats.length - 1) {
      // Play the dealer hand
      handleDealer(gs);
      // Check hands for winners and losers
      checkHandsWon(gs);
      payoutHands(gs);
      gs.roundOver = true;
    } else {
      gs.seats[seat + 1].isTurn = true;
    }
  }

  return { gs, actionSuccess: true };
};

const payoutHands = (gs: GameState) => {
  gs.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.isBlackjack) {
        seat.player.stack += 2.5 * hand.bet;
      } else if (hand.isPush) {
        seat.player.stack += hand.bet;
      } else if (hand.isWon) {
        seat.player.stack += 2 * hand.bet;
      }
      hand.bet = 0;
    });
  });
};

export const createNewGameState = (
  roomInfo: RoomWithUsersAndSeats
): GameState => {
  return {
    rommDbId: roomInfo.id,
    gameTableDbId: roomInfo.gameTableId,
    dealerHand: [],
    seats: [...createSeats(roomInfo.UserRooms, roomInfo.gameTableId)],
    roundOver: false,
    timeToAct: 20,
    timeToBet: 15,
    deck: shuffle(createDeck()),
    shuffle: false,
  };
};

const createSeats = (
  userRooms: UserRoomWithSeat[],
  gameTableId: number
): Seat[] => {
  return userRooms.map((userRoom) => ({
    hands: [
      {
        cards: [],
        bet: 0,
        isCurrentHand: true,
        isDone: false,
      },
    ],
    isTurn: userRoom.UserSeat.position === 1,
    isAfk: false,
    player: {
      user_ID: userRoom.userId,
      stack: userRoom.initialStack,
      userRoomDbId: userRoom.roomId,
      gameTableDbId: gameTableId,
    },
  }));
};

// Begin to deal cards for the game
export const dealCards = (gs: GameState): GameState => {
  // First round: deal one face-up card to each player
  gs.seats.forEach((seat) => {
    const card = drawCard(gs.deck, gs);
    if (card) {
      seat.hands[0].cards.push({
        ...card,
        faceUp: true,
      });
    }
  });

  // First round: deal one face-up card to the dealer
  const dealerCard1 = drawCard(gs.deck, gs);
  if (dealerCard1) {
    gs.dealerHand.push({
      ...dealerCard1,
      faceUp: true,
    });
  }

  // Second round: deal one face-up card to each player
  gs.seats.forEach((seat) => {
    const card = drawCard(gs.deck, gs);
    if (card) {
      seat.hands[0].cards.push({
        ...card,
        faceUp: true,
      });
    }
  });

  // Second round: deal one face-down card to the dealer
  const dealerCard2 = drawCard(gs.deck, gs);
  if (dealerCard2) {
    gs.dealerHand.push({
      ...dealerCard2,
      faceUp: false,
    });
  }

  // Check for Blackjacks
  gs.seats.forEach((seat) => {
    if (computeHandCount(seat.hands[0].cards) === 21) {
      seat.hands[0].isDone = true;
      seat.hands[0].isWon = true;
      seat.hands[0].isBlackjack = true;
    }
  });

  // Check if the dealer has a blackjack
  if (computeHandCount(gs.dealerHand) === 21) {
    gs.seats.forEach((seat) => {
      if (!computeHandCount(seat.hands[0].cards)) {
        seat.hands[0].isDone = true;
        seat.hands[0].isWon = false;
        seat.hands[0].isBlackjack = false;
        gs.roundOver = true;
      } else {
        seat.hands[0].isDone = true;
        seat.hands[0].isWon = false;
        seat.hands[0].isBlackjack = false;
        seat.hands[0].isPush = true;
        gs.roundOver = true;
      }
    });
  }

  if (gs.seats.every((seat) => seat.hands[0].isDone)) {
    gs.roundOver = true;
    payoutHands(gs);
  }

  return gs;
};

export const addPlayer = (gs: GameState, player: Player): GameState => {
  gs.seats.push({
    hands: [
      {
        cards: [],
        bet: 0,
        isCurrentHand: false,
        isDone: false,
      },
    ],
    isTurn: false,
    isAfk: false,
    player: player,
  });
  return gs;
};

// Check and populate winners
export const checkHandsWon = (gs: GameState): GameState => {
  const dealerTotal = computeHandCount(gs.dealerHand);
  // Dealer Busts
  if (dealerTotal > 21) {
    gs.seats.forEach((seat) => {
      seat.hands.forEach((hand) => {
        hand.isDone = true;
        hand.isWon = true;
      });
    });
    return gs;
  }
  gs.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      const total = computeHandCount(hand.cards);
      // Player Busts
      if (total > 21) {
        hand.isDone = true;
        hand.isWon = false;
        // Blackjack
      } else if (total === 21 && hand.cards.length === 2) {
        hand.isDone = true;
        hand.isBlackjack = true;
        hand.isWon = true;
        // Player Loses
      } else if (total < dealerTotal) {
        hand.isDone = true;
        hand.isWon = false;
        // Player Wins
      } else if (total > dealerTotal) {
        hand.isDone = true;
        hand.isWon = true;
        // Push
      } else if (total === dealerTotal) {
        hand.isDone = true;
        hand.isPush = true;
      }
    });
  });
  return gs;
};

// Return a new game state with face down cards removed
export const removeFaceDownCards = (gameState: GameState): GameState => {
  // Deep copy gameState to prevent mutation
  const newGameState: GameState = structuredClone(gameState);
  newGameState.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      hand.cards.forEach((card) => {
        if (!card.faceUp) {
          card.card = 'HIDDEN';
          card.suit = 'HIDDEN';
        }
      });
    });
  });
  newGameState.dealerHand.forEach((card) => {
    if (!card.faceUp) {
      card.card = 'HIDDEN';
      card.suit = 'HIDDEN';
    }
  });
  newGameState.deck.currentDeck.forEach((card) => {
    if (!card.faceUp) {
      card.card = 'HIDDEN';
      card.suit = 'HIDDEN';
    }
  });
  return newGameState;
};

export const checkDealReady = (gameState: GameState) => {
  return (
    gameState.seats.every((seat) =>
      seat.hands.every((hand) => hand.bet > 0 && hand.cards.length < 1)
    ) && !gameState.roundOver
  );
};
