/**
 * Represents a player in the game
 * @type {Player}
 * @property {number} userId - ID of the player
 * @property {number} stack - Current stack of the player
 * @property {number} userRoomDbId - ID of the user room in the database
 * @property {boolean} isAfk - Whether the player is away from the table
 * @property {number[]} seatIndexes - Array of seat indexes
 * */
export type Player = Readonly<{
  userId: number;
  stack: number;
  userRoomDbId: number;
  isAfk: boolean;
  seatIndexes: number[];
}>;
