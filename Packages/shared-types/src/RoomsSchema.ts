import { z } from 'zod';

export const roomsCreateSchema = z.object({
  id: z.number().int().optional(), // `id` is optional because it's auto-incremented
  url: z.string().min(1, 'URL is required'),
  gameTableId: z.number().int(), // Foreign key
  roomOpenTime: z.coerce.date().default(new Date()), // Defaults to `now()`
  roomCloseTime: z.coerce.date().nullable().optional(), // Nullable and optional
  maxRoomSize: z
    .number()
    .int()
    .min(1, 'Max room size must be at least 1')
    .default(15),
});

export const getRoomsSchema = z.array(roomsCreateSchema);

export type RoomData = z.infer<typeof roomsCreateSchema>;
