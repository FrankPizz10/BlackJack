import { ActionType } from './ActionType';
import { Bet } from './Bet';
import { z } from 'zod';

export type Action = {
  actionType: ActionType;
  bet: Bet | null;
};

export const eventSchema = z.object({
  roomUrl: z.string().min(1, 'Room URL is required').startsWith('bjn'),
});

export type Event = z.infer<typeof eventSchema>;

export type ActionEvent = Action & Event;
