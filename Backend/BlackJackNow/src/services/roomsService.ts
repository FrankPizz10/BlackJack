import { AppContext } from '../context';
import { RoomData } from '@shared-types/RoomsSchema';

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

export const createRoom = async (context: AppContext, roomData: RoomData) => {
  try {
    const roomDb = await context.prisma.rooms.create({
      data: {
        url: roomData.url,
        gameTableId: roomData.gameTableId,
        roomOpenTime: roomData.roomOpenTime,
        roomCloseTime: roomData.roomCloseTime,
        maxRoomSize: roomData.maxRoomSize,
      },
    });
    const roomsCache = await context.redis.get('rooms');
    if (roomsCache) {
      try {
        const parsedRooms = JSON.parse(roomsCache);

        // Ensure parsedRooms is an array; if it's an object, wrap it in an array
        const updatedRooms = Array.isArray(parsedRooms)
          ? [...parsedRooms, roomData]
          : [parsedRooms, roomData];

        await context.redis.set('rooms', JSON.stringify(updatedRooms));
      } catch (error) {
        console.error('Error parsing roomsCache:', error);
      }
    } else {
      // Initialize cache with the first room inside an array
      await context.redis.set('rooms', JSON.stringify([roomData]));
    }
    return { roomDb, roomsCache };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};
