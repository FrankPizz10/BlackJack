import { Router } from 'express';
import { AppContext } from '../context';
import {
  getRoomsController,
  postRoomsController,
} from '../controllers/roomsController';

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
   *       500:
   *         description: Corrupted Cache
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Server error"
   */
  router.get('/', getRoomsController(context));

  /**
   * @swagger
   * /api/rooms:
   *   post:
   *     summary: Post rooms example
   *     description: Returns rooms
   *     tags:
   *       - Rooms
   *     responses:
   *       201:
   *         description: Successful response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Rooms"
   *       400:
   *         description: Inavlid request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Invalid request"
   */
  router.post('/', postRoomsController(context));

  return router;
};

export default roomsRouter;
