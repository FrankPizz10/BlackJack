// mockContextGameState.ts

import { GameState } from '../../src/Game/GameState';
import { Seat } from '../../src/Game/Seat';
import { Card } from '../../src/Game/Card';
import { Suit } from '../../src/Game/Suit';
import { Deck } from '../../src/Game/Deck';
import { Player } from '../../src/Game/Player';
import { Hand } from '../../src/Game/Hand';

// Sample cards
const card10: Card = { suit: Suit.Hearts, value: '10', faceUp: true };
const card5: Card = { suit: Suit.Spades, value: '5', faceUp: true };
const cardA: Card = { suit: Suit.Diamonds, value: 'A', faceUp: true };
const cardCut: Card = { suit: Suit.Cut, value: 'CUT', faceUp: false };
const cardHidden: Card = { suit: Suit.Hidden, value: 'HIDDEN', faceUp: false };

// Sample hands
const blackjackHand: Hand = {
  cards: [cardA, card10],
  bet: 100,
  isDone: false,
  isBlackjack: true,
};

const under21Hand: Hand = {
  cards: [card10, card5],
  bet: 100,
  isDone: false,
};

const pairHand: Hand = {
  cards: [{ suit: Suit.Hearts, value: '8', faceUp: true }, { suit: Suit.Diamonds, value: '8', faceUp: true }],
  bet: 100,
  isDone: false,
};

const emptyHand: Hand = {
  cards: [],
  bet: 100,
  isDone: false,
};

// Players
const richPlayer: Player = {
  user_ID: 1,
  stack: 1000,
  userRoomDbId: 111,
  gameTableDbId: 999,
};

const brokePlayer: Player = {
  user_ID: 2,
  stack: 10,
  userRoomDbId: 222,
  gameTableDbId: 999,
};

// Corrected seats (no isTurn, no extra props)
export const seatBlackjack: Seat = {
  handIndex: 0,
  hands: [blackjackHand],
  isAfk: false,
  player: richPlayer,
};

export const seatUnder21: Seat = {
  handIndex: 0,
  hands: [under21Hand],
  isAfk: false,
  player: richPlayer,
};

export const seatSplitEligible: Seat = {
  handIndex: 0,
  hands: [pairHand],
  isAfk: false,
  player: richPlayer,
};

export const seatSplitIneligible: Seat = {
  handIndex: 0,
  hands: [pairHand],
  isAfk: false,
  player: brokePlayer,
};

export const seatEmptyHand: Seat = {
  handIndex: 0,
  hands: [emptyHand],
  isAfk: false,
  player: richPlayer,
};

// ✅ Correct deck structure (baseDeck, currentDeck, numDecks)
export const mockDeck: Readonly<Deck> = {
  baseDeck: [card10, card5, cardA],
  currentDeck: [card10, card5, cardA, cardCut, cardHidden],
  numDecks: 1,
};

// ✅ Correct GameState structure
export const baseGameState: GameState = {
  rommDbId: 1,
  gameTableDbId: 100,
  dealerHand: [card5],
  turnIndex: 0,
  seats: [seatBlackjack, seatUnder21, seatSplitEligible, seatSplitIneligible, seatEmptyHand],
  roundOver: false,
  timeToAct: 30,
  timeToBet: 15,
  deck: mockDeck,
  shuffle: false,
};
