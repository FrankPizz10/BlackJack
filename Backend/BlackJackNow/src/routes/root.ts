import express, { Express, Request, Response } from 'express';

const rootRouter: Express = express();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get root example
 *     description: Returns root
 *     tags:
 *       - Root
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
 *                   example: "Hello, Express with TypeScript!"
 */
rootRouter.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});

export default rootRouter;
