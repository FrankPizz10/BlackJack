import { Hand } from './Hand';
import { Player } from './Player';

export type Seat = Readonly<{
  hands: ReadonlyArray<Hand>;
  isAfk: boolean;
  isTurn: boolean;
  player: Readonly<Player> | null;
}>;
