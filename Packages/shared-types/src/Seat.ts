import { Hand } from './Hand';
import { Player } from './Player';

export type Seat = {
  hands: Hand[];
  isAfk: boolean;
  isTurn: boolean;
  player: Player;
};
