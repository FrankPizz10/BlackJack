import { UserSeat } from '../db/UserSeat';
import { GameState } from './GameState';
import { Card } from './Card';

export const positionHelper = (seat: UserSeat | null) => {
  return seat && seat.position ? seat.position - 1 : 0;
};

export const getCards = (
  gameState: GameState,
  position: UserSeat
): ReadonlyArray<ReadonlyArray<Card>> => {
  return gameState.seats[positionHelper(position)].hands.map(
    (hand) => hand.cards
  );
};

export const getHands = (gameState: GameState, position: UserSeat) => {
  return gameState.seats[positionHelper(position)].hands;
};

export const getDealerCards = (gameState: GameState) => {
  return gameState.dealerHand;
};

export const isCardsDealt = (gameState: GameState | null) => {
  if (!gameState) return false;
  return gameState.seats.some((seat) => seat.hands[0].cards.length > 0);
};
