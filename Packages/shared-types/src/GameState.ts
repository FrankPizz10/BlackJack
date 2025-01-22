import { CardPair } from './CardPair';
import { Deck } from './Deck';
import { Hand } from './Hand';

// Gamestate.ts will be stored in Redis Cache

// Redis Key for the Gamestate will look like Game:{roomId}
export type GameState = {
  rommDbId: number;
  gameTableDbId: number;
  dealerHand: CardPair[];
  currentPosition: number;
  roundStatus: RoundStatus;
  timeToAct: number;
  timeToBet: number;
  deck: Deck;
};

// Redis Key for the Player Gamestate will look like Game:{roomId}:Player:{playerId}
export type PlayerGameState = {
  userRoomDbId: number;
  gameTableDbId: number;
  seatState: SeatState[];
};

export type SeatState = {
  hands: Hand[];
  position: number;
};

enum RoundStatus {}
// TODO

// client -> { playerID, roomID, { action: {position, hand, typeOfAcion, betAmount}}}
