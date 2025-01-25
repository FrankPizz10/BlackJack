import { AppContext } from '../context';
import { createRoom, getRooms } from '../services/roomsService';
import { Request, Response } from 'express';
import { roomsCreateSchema, getRoomsSchema } from '@shared-types/RoomsSchema';
import { ZodError } from 'zod';

export const getRoomsController = (context: AppContext) => {
  return async (req: Request, res: Response) => {
    try {
      const { roomsDb, roomsCache: roomsCacheString } = await getRooms(context);
      const roomsCache = roomsCacheString ? JSON.parse(roomsCacheString) : null;
      const parsedRoomsCache = getRoomsSchema.safeParse(roomsCache);
      if (!parsedRoomsCache.success) {
        res
          .status(500)
          .json({ error: new ZodError(parsedRoomsCache.error.errors) });
      } else {
        res.status(200).json({ roomsDb, roomsCache: parsedRoomsCache.data });
      }
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
};

export const postRoomsController = (context: AppContext) => {
  return async (req: Request, res: Response): Promise<void> => {
    // Validate the request body using zod schema
    const parsedRoomData = roomsCreateSchema.safeParse(req.body);

    if (!parsedRoomData.success) {
      res
        .status(400)
        .json({ error: new ZodError(parsedRoomData.error.errors) });
      return;
    }

    try {
      // Attempt to create the room using the validated data
      const result = await createRoom(context, parsedRoomData.data);
      res.status(201).json(result); // Use 201 Created for successful resource creation
    } catch (error: unknown) {
      console.error('Error creating room:', error);
      res.status(500).json({
        error: 'Failed to create room',
        details: (error as Error).message,
      });
    }
  };
};
