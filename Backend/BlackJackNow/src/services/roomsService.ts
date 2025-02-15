import { CreateRoomData } from '@shared-types/db/Room';
import { AppContext } from '../context';
import { generateRoomUrl } from '../utils/crypto';
import { createGameTable } from './gameTableService';

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
