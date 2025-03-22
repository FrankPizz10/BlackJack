import { Hand } from './Hand';
import { Player } from './Player';

/**
 * Represents a seat in the game.
 * @type {Seat}
 * @property {number} handIndex - Index of the current hand
 * @property {ReadonlyArray<Hand>} hands - Array of hands
 * @property {boolean} isAfk - Whether the player is away from the table
 * @property {boolean} isTurn - Whether the player has the turn
 * @property {Readonly<Player> | null} player - Player object or null if no player is assigned
 */
export type Seat = Readonly<{
  handIndex: number; // Index of the current hand
  hands: ReadonlyArray<Hand>;
  isAfk: boolean;
  player: Readonly<Player> | null;
}>;
