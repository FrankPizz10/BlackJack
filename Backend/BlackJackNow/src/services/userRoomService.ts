import { AppContext } from '../context';
import { CreateUserRoom } from '@shared-types/db/UserRoom';

export const createUserRoom = async (
  context: AppContext,
  createUserRoom: CreateUserRoom
) => {
  const { roomId, userId, host, name } = createUserRoom;
  const userRoom = await context.prisma.user_Room.create({
    data: {
      roomId,
      userId,
      host,
      name,
    },
  });
  return userRoom;
};
