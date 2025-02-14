import { AppContext } from '../context';
import { RoomData } from '@shared-types/RoomsSchema';
import crypto from 'crypto';
import { createGameTable } from './gameTableService';
import { createUserRoom } from './userRoomService';

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

export const createRoom = async (context: AppContext, roomData?: RoomData) => {
  try {
    let url = roomData?.url ?? '';
    let gameTableId = roomData?.gameTableId;

    if (!url || !gameTableId) {
      // Generate a game table if not provided
      const { gameTableDb } = await createGameTable(context);
      gameTableId = gameTableDb.id;

      // Generate a unique URL
      let isUnique = false;
      while (!isUnique) {
        url = crypto.randomBytes(4).toString('hex'); // Generates an 8-character hex string
        const existingRoom = await context.prisma.rooms.findUnique({
          where: { url },
        });
        if (!existingRoom) {
          isUnique = true;
        }
      }
    }

    const roomDb = await context.prisma.rooms.create({
      data: {
        url,
        gameTableId,
        roomOpenTime: roomData?.roomOpenTime ?? new Date(),
        roomCloseTime: roomData?.roomCloseTime ?? null,
        maxRoomSize: roomData?.maxRoomSize ?? 15,
      },
    });
    return { roomDb };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};
