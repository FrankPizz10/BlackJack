import { ActionType } from './ActionType';
import { Bet } from './Bet';

export type Action = {
  actionType: ActionType;
  bet: Bet | null;
};

export type ActionEvent = Action & {
  roomUrl: string;
};
