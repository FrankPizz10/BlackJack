import { Hand } from './Hand';

/**
 * Represents a seat in the game.
 * @type {Seat}
 * @property {number} handIndex - Index of the current hand
 * @property {ReadonlyArray<Hand>} hands - Array of hands
 */
export type Seat = Readonly<{
  handIndex: number; // Index of the current hand
  hands: ReadonlyArray<Hand>;
}>;
