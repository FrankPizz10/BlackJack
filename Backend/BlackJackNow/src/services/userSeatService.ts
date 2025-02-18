import { AppContext } from '../context';
import { UserRoom } from '@shared-types/db/UserRoom';

export const createUserSeat = async (
  context: AppContext,
  userRoom: UserRoom
) => {
  const userSeat = await context.prisma.seats.create({
    data: {
      userRoomId: userRoom.id,
      position: 1,
    },
  });
  return userSeat;
};
