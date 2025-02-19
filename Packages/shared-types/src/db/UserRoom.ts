import { z } from 'zod';
import { RoomData } from './Room';
import { UserSeat } from './UserSeat';

export const userRoomSchema = z.object({
  id: z.number().int(),
  roomId: z.number().int(),
  userId: z.number().int(),
  host: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  initialStack: z.number().int().default(100),
});

export const createUserRoomSchema = z.object({
  roomId: z.number().int(),
  userId: z.number().int(),
  host: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  initialStack: z.number().int().default(100),
});

export type UserRoom = z.infer<typeof userRoomSchema>;
export type UserRoomWithSeat = UserRoom & { UserSeat: UserSeat };
export type CreateUserRoom = z.infer<typeof createUserRoomSchema>;

export type RoomWithUsersAndSeats = RoomData & {
  UserRooms: UserRoomWithSeat[];
};
