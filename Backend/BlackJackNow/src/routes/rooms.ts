import express, { Express, Request, Response } from 'express';

const roomsRouter: Express = express();

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
roomsRouter.get('/api/rooms', (req: Request, res: Response) => {
  res.send('Rooms');
});

export default roomsRouter;

