export interface TestGameState {
  turn: number;
  roomId: string;
}

const MINUTE = 60 * 1000;
export const TURN_TIME_LIMIT = MINUTE / 2;
