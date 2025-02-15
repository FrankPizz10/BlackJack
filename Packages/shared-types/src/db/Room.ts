import { z } from 'zod';

export const roomsCreateSchema = z.object({
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

export const roomSchema = roomsCreateSchema.extend({ id: z.number().int() });

export const joinRoomSchema = z.object({
  roomUrl: z.string().min(1, 'URL is required'),
});

export const getRoomsSchema = z.array(roomsCreateSchema);

export type CreateRoomData = z.infer<typeof roomsCreateSchema>;
export type RoomData = z.infer<typeof roomSchema>;
export type JoinRoom = z.infer<typeof joinRoomSchema>;

export type groupedRoomData = {
  roomsDb: CreateRoomData[];
  roomsCache: CreateRoomData[];
};
