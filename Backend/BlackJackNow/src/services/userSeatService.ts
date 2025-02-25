import { AppContext } from '../context';
import { UserRoom } from '@shared-types/db/UserRoom';

export const createUserSeat = async (
  context: AppContext,
  userRoom: UserRoom,
  position: number = 1
) => {
  const userSeat = await context.prisma.seats.create({
    data: {
      userRoomId: userRoom.id,
      position,
    },
  });
  return userSeat;
};

// Get all the seats in a room by room id
export const getUserSeatsByRoom = async (
  context: AppContext,
  roomId: number
) => {
  const userRooms = await context.prisma.user_Room.findMany({
    where: {
      roomId,
    },
  });
  const userSeats = await context.prisma.seats.findMany({
    where: {
      userRoomId: {
        in: userRooms.map((userRoom) => userRoom.id),
      },
    },
  });
  return userSeats;
};
