import { CreateRoomData } from '@shared-types/db/Room';
import { AppContext } from '../context';
import { generateRoomUrl } from '../utils/crypto';
import { createGameTable } from './gameTableService';
import { RoomWithUsersAndSeats } from '@shared-types/db/UserRoom';

export const getRooms = async (context: AppContext) => {
  try {
    const roomsDb = await context.prisma.rooms.findMany();
    const roomsCache = await context.redis.get('rooms');
    return { roomsDb, roomsCache };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

export const createRoom = async (
  context: AppContext,
  roomData?: CreateRoomData
) => {
  try {
    let url = roomData?.url ?? '';
    let gameTableId = roomData?.gameTableId;

    if (!url || !gameTableId) {
      // Generate a game table if not provided
      const { gameTableDb } = await createGameTable(context);
      console.log('Game table created:', gameTableDb);
      gameTableId = gameTableDb.id;

      // Generate a unique URL
      let isUnique = false;
      while (!isUnique) {
        url = generateRoomUrl();
        const existingRoom = await context.prisma.rooms.findUnique({
          where: { url },
        });
        if (!existingRoom) {
          isUnique = true;
        }
      }
    }
    console.log('Room URL:', url);
    const roomDb = await context.prisma.rooms.create({
      data: {
        url,
        gameTableId,
        roomOpenTime: roomData?.roomOpenTime ?? new Date(),
        roomCloseTime: roomData?.roomCloseTime ?? null,
        maxRoomSize: roomData?.maxRoomSize ?? 15,
      },
    });
    console.log('Room created:', roomDb);
    return { roomDb };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Get room info, user rooms, and user seats
export const getRoomInfoByUrl = async (context: AppContext, url: string) => {
  try {
    const roomDb = await context.prisma.rooms.findUniqueOrThrow({
      where: { url },
      include: {
        UserRoom: { include: { Seats: true } },
      },
    });
    const roomWithUsersAndSeats: RoomWithUsersAndSeats = {
      id: roomDb.id,
      url: roomDb.url,
      gameTableId: roomDb.gameTableId,
      roomOpenTime: roomDb.roomOpenTime,
      roomCloseTime: roomDb.roomCloseTime,
      maxRoomSize: roomDb.maxRoomSize,
      UserRooms: roomDb.UserRoom.map((userRoom) => ({
        id: userRoom.id,
        userId: userRoom.userId,
        roomId: userRoom.roomId,
        host: userRoom.host,
        name: userRoom.name,
        initialStack: userRoom.initialStack || 100,
        UserSeats: userRoom.Seats.map((seat) => ({
          id: seat.id,
          position: seat.position,
          userRoomId: seat.userRoomId,
          handsPlayed: seat.handsPlayed,
          handsWon: seat.handsWon,
          blackjacks: seat.blackjacks || 0,
        })),
      })),
    };
    return roomWithUsersAndSeats;
  } catch (error) {
    console.error('Error fetching room:', error);
    throw error;
  }
};

export const createSeat = async (
  context: AppContext,
  url: string,
  seatPosition: number,
  userRoomId: number
) => {
  try {
    const userSeat = await context.prisma.seats.create({
      data: {
        position: seatPosition,
        userRoomId: userRoomId,
      },
    });
    return userSeat;
  } catch (error) {
    console.error('Error taking seat:', error);
    throw error;
  }
};
