import { Hand } from './Hand';
import { Player } from './Player';

export type Seat = {
  hands: Hand[];
  is_afk: boolean;
  seat_turn: boolean;
  player: Player;
};
