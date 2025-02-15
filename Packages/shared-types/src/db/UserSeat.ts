import { z } from 'zod';

export const userSeatSchema = z.object({
  id: z.number().int(),
  position: z.number().int(),
  userRoomId: z.number().int(),
  handsPlayed: z.number().int().nullable().optional(),
  handsWon: z.number().int().nullable().optional(),
  blackjacks: z.number().int().nullable().optional(),
});

export type UserSeat = z.infer<typeof userSeatSchema>;

