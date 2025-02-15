import { ActionType } from './ActionType';
import { Bet } from './Bet';
import { z } from 'zod';

export type Action = {
  actionType: ActionType;
  bet: Bet | null;
};

export type ActionEvent = Action & {
  roomUrl: string;
};
