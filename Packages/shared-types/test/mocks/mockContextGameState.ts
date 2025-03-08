import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { GameState } from '../../src/Game/GameState.ts';
import { Player } from '../../src/Game/Player.ts';
import { Seat } from '../../src/Game/Seat.ts';

export type MockContextGameState = DeepMockProxy<Partial<GameState>>;
export const mockContextGameState: MockContextGameState = mockDeep<Partial<GameState>>();

Object.defineProperty(mockContextGameState, 'seats', {
  value: [
    {
      hands: [{ cards: [], bet: 0, isCurrentHand: true, isDone: false }],
      isAfk: false,
      isTurn: true,
      player: { user_ID: 1, stack: 1000, userRoomDbId: 1, gameTableDbId: 1 } as Player,
    } as Seat,
  ],
  writable: false,
});

Object.defineProperty(mockContextGameState, 'roundOver', {
  value: false,
  writable: false,
});

Object.defineProperty(mockContextGameState, 'shuffle', {
  value: false,
  writable: false,
});