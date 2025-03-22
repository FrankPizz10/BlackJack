import { z } from 'zod';

export const betSchema = z.object({
  betAmount: z.number().int(),
  bettingSeat: z.number().int(),
});

export type Bet = z.infer<typeof betSchema>;
