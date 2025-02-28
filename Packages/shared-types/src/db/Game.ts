import { z } from 'zod';
import { roomSchema } from './Room';
import { userRoomSchema } from './UserRoom';
import { userSeatSchema } from './UserSeat';

// Create Game Scheme consists of RoomData and UserRoom
export const startGameSchema = z.object({
  roomDb: roomSchema,
  userRoomDb: userRoomSchema,
  userSeatDb: userSeatSchema,
});

export const roomJoinedSchema = z.object({
  roomDb: roomSchema,
  userRoomDb: userRoomSchema,
});

export type StartGame = z.infer<typeof startGameSchema>;
export type RoomJoined = z.infer<typeof roomJoinedSchema>;
