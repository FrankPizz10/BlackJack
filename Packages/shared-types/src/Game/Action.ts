import { ActionType } from './ActionType';
import { Bet, betSchema } from './Bet';
import { z } from 'zod';

export const actionSchema = z.object({
  actionType: z.nativeEnum(ActionType),
  seatIndex: z.number().int(),
  handIndex: z.number().int(),
  bet: betSchema.nullish(),
});

export type Action = z.infer<typeof actionSchema>;

export const eventSchema = z.object({
  roomUrl: z.string().min(1, 'Room URL is required').startsWith('bjn'),
});

export const actionEventSchema = actionSchema.merge(eventSchema);

export type Event = z.infer<typeof eventSchema>;

export type ActionEvent = Action & Event;
