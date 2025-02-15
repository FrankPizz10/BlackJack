import { z } from 'zod';
import { roomSchema } from './Room';
import { userRoomSchema } from './UserRoom';

// Create Game Scheme consists of RoomData and UserRoom
export const startGameSchema = z.object({
  roomDb: roomSchema,
  userRoomDb: userRoomSchema,
});

export type StartGame = z.infer<typeof startGameSchema>;
