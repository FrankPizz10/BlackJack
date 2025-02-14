import { z } from 'zod';

export const userRoomSchema = z.object({
  id: z.number().int(),
  roomId: z.number().int(),
  userId: z.number().int(),
  host: z.boolean(),
  name: z.string().min(1, 'Name is required'),
});

export const createUserRoomSchema = z.object({
  roomId: z.number().int(),
  userId: z.number().int(),
  host: z.boolean(),
  name: z.string().min(1, 'Name is required'),
});

export type UserRoom = z.infer<typeof userRoomSchema>;
export type CreateUserRoom = z.infer<typeof createUserRoomSchema>;

