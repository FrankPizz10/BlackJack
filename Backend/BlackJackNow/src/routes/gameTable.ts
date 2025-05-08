import { Router } from 'express';
import { AppContext } from '../context';
import { updateGameTableController } from '../controllers/gameTableController';

const gameTableRouter = (context: AppContext): Router => {
  const router: Router = Router();

  /**
   * @swagger
   * /api/gameTable/{gameTableId}:
   *   patch:
   *     summary: Update game table example
   *     description: Updates the game table with the given ID
   *     tags:
   *       - Game Table
   *     parameters:
   *       - name: gameTableId
   *         in: path
   *         required: true
   *         description: The ID of the game table to update
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               minBet:
   *                 type: integer
   *                 example: 10
   *               maxBet:
   *                 type: integer
   *                 example: 100
   *               maxSeats:
   *                 type: integer
   *                 example: 6
   *               timeToAct:
   *                 type: integer
   *                 example: 30
   *               timeToBet:
   *                 type: integer
   *                 example: 15
   *               maxAwayTime:
   *                 type: integer
   *                 example: 60
   *               numberOfDecks:
   *                 type: integer
   *                 example: 6
   *               shuffleFrequency:
   *                 type: integer
   *                 example: 75
   *               blackjackPayout:
   *                 type: number
   *                 example: 1.5
   *               insurancePayout:
   *                 type: number
   *                 example: 2
   *               surrender:
   *                 type: boolean
   *                 example: true
   *               doubleAfterSplit:
   *                 type: boolean
   *                 example: true
   *               maxSplits:
   *                 type: integer
   *                 example: 3
   *               resplitAces:
   *                 type: boolean
   *                 example: true
   *               soft17:
   *                 type: boolean
   *                 example: false
   *               sideBets:
   *                 type: boolean
   *                 example: true
   *               betOnOtherBoxes:
   *                 type: boolean
   *                 example: false
   *               rejoin:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Successful response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 gameTableDb:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     minBet:
   *                       type: integer
   *                       example: 10
   *                     maxBet:
   *                       type: integer
   *                       example: 100
   * *               maxSeats:
   *                 type: integer
   *                 example: 6
   *               timeToAct:
   *                 type: integer
   *                 example: 30
   *               timeToBet:
   *                 type: integer
   *                 example: 15
   *               maxAwayTime:
   *                 type: integer
   *                 example: 60
   *               numberOfDecks:
   *                 type: integer
   *                 example: 6
   *               shuffleFrequency:
   *                 type: integer
   *                 example: 75
   *               blackjackPayout:
   *                 type: number
   *                 example: 1.5
   *               insurancePayout:
   *                 type: number
   *                 example: 2
   *               surrender:
   *                 type: boolean
   *                 example: true
   *               doubleAfterSplit:
   *                 type: boolean
   *                 example: true
   *               maxSplits:
   *                 type: integer
   *                 example: 3
   *               resplitAces:
   *                 type: boolean
   *                 example: true
   *               soft17:
   *                 type: boolean
   *                 example: false
   *               sideBets:
   *                 type: boolean
   *                 example: true
   *               betOnOtherBoxes:
   *                 type: boolean
   *                 example: false
   *               rejoin:
   *                 type: boolean
   *                 example: true
   *      400:
   *        description: Invalid request
   *       content:
   *          application/json:
   *            schema:
   *              type: object
   *             properties:
   *               error:
   *                type: string
   *               example: "Invalid request"
   *      500:
   *       description: Server error
   *      content:
   *         application/json:
   *           schema:
   *             type: object
   *            properties:
   *              error:
   *               type: string
   *              example: "Server error"
   */
  router.patch('/:gameTableId', updateGameTableController(context));
  return router;
};

export default gameTableRouter;

