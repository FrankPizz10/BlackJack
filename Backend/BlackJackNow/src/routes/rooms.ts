import { Router, Request, Response } from 'express';
import { AppContext } from '../context';
import { getRooms, createRoom } from '../services/roomsService';
import roomsCreateSchema from '@shared-types/RoomsSchema';
import { ZodError } from 'zod';

const roomsRouter = (context: AppContext): Router => {
  const router: Router = Router();

  /**
   * @swagger
   * /api/rooms:
   *   get:
   *     summary: Get rooms example
   *     description: Returns rooms
   *     tags:
   *       - Rooms
   *     responses:
   *       200:
   *         description: Successful response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Rooms"
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await getRooms(context);
      res.json(result);
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * @swagger
   * /api/rooms:
   *   post:
   *     summary: Post rooms example
   *     description: Returns rooms
   *     tags:
   *       - Rooms
   *     responses:
   *       200:
   *         description: Successful response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Rooms"
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
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
  });

  return router;
};

export default roomsRouter;
