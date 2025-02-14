import { AppContext } from 'src/context';

export const createUserRoom = async (
  context: AppContext,
  userId: number,
  roomId: number,
  host: boolean,
  name: string
) => {
  const userRoom = await context.prisma.user_Room.create({
    data: {
      userId,
      roomId,
      host,
      name,
    },
  });
  return userRoom;
};

