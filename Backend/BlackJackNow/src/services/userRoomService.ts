import { AppContext } from '../context';
import { CreateUserRoom } from '@shared-types/db/UserRoom';

export const createUserRoom = async (
  context: AppContext,
  createUserRoom: CreateUserRoom,
  initialStack: number = 100
) => {
  const { roomId, userId, host, name } = createUserRoom;
  const userRoom = await context.prisma.user_Room.create({
    data: {
      roomId,
      userId,
      host,
      name,
      initialStack,
    },
  });
  return userRoom;
};
