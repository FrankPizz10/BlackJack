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

export const getBetAmount = (
  gameState: GameState | null,
  seat: UserSeat | null,
  handIndex: number
): number => {
  if (!gameState) return 0;
  const seatIndex = positionHelper(seat);
  const hand = gameState.seats[seatIndex].hands[handIndex];
  return hand ? hand.bet : 0;
};

export const getStackSize = (
  gameState: GameState | null,
  seat: UserSeat | null
): number => {
  if (!gameState || !seat) return 0;
  const seatIndex = positionHelper(seat);
  return gameState.players[seatIndex].stack;
};

export const createTempUserSeats = (numSeats: number): UserSeat[] => {
  return Array.from({ length: numSeats + 1 }, (_, index) => ({
    id: index,
    position: index + 1,
    userRoomId: 1,
  }));
};
