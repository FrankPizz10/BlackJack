import { Router } from 'express';
import {
  getTotalActiveRooms,
  getTotalActiveSocketConnections,
} from '../controllers/socketController';
import { Server } from 'socket.io';

const socketRouter = (io: Server): Router => {
  const router: Router = Router();
  /**
   * @swagger
   * /api/sockets/total-active-connections:
   *   get:
   *     summary: Get total active socket connections
   *     description: Returns the total number of active socket connections
   *     tags:
   *       - Sockets
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
   *                   example: "Total active socket connections"
   *                 count:
   *                   type: number
   *                   example: 10
   */
  router.get('/total-active-connections', getTotalActiveSocketConnections(io));

  /**
   * @swagger
   * /api/sockets/total-active-rooms:
   *   get:
   *     summary: Get total active rooms
   *     description: Returns the total number of active rooms
   *     tags:
   *       - Sockets
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
   *                   example: "Total active rooms"
   *                 count:
   *                   type: number
   *                   example: 10
   */
  router.get('/total-active-rooms', getTotalActiveRooms(io));
  return router;
};

export default socketRouter;
