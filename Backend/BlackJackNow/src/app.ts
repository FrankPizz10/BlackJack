import express from 'express';
import roomsRouter from './routes/rooms';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swaggerConfig';
import rootRouter from './routes/root';
import dotenv from 'dotenv';
import { createContext } from './context';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { firebaseAuthApi, firebaseAuthSocket } from './middleware/firebaseAuth';
import { Queue } from 'bullmq';
import { TestGameState, TURN_TIME_LIMIT } from '@shared-types/Bullmq/jobs';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const context = createContext();

app.use(rootRouter);
app.use('/api/rooms', roomsRouter(context));

// Enable Swagger UI only in development
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
}

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

if (process.env.DISABLE_MIDDLEWARE !== 'true') {
  // Use firebase middleware if not disabled
  app.use('/api', firebaseAuthApi);
  io.use(firebaseAuthSocket);
}

const turnQueue = new Queue('turnQueue', { connection: context.redis });

const startTurn = async (roomId: string): Promise<string | undefined> => {
  if (!roomId) return;
  const job = await turnQueue.add(
    'turn',
    { roomId },
    { delay: TURN_TIME_LIMIT, removeOnComplete: true, removeOnFail: true }
  );
  return job.id;
};

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);
  // subscribe to a redis channel
  context.redisSub.subscribe(`channel:gameState:${socket.id}`, (err) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    }
    console.log(`Subscribed to channel:gameState:${socket.id}`);
  });
  // join room
  socket.join(socket.id);
  // start turn
  const jobId = await startTurn(socket.id);
  if (!jobId) {
    console.error('Error starting turn job');
    return;
  }
  // update redis game state
  const gameState: TestGameState = { turn: 0, roomId: socket.id, jobId };
  context.redis.set(`gameState:${socket.id}`, JSON.stringify(gameState));
  // broadcast game state
  io.to(socket.id).emit('gameState', gameState);

  socket.on('takeAction', async (data) => {
    console.log('Action received:', data);

    if (!data.roomId) return; // Early return if roomId is missing

    try {
      // Get and parse game state
      const gameStateRaw = await context.redis.get(`gameState:${data.roomId}`);
      if (!gameStateRaw) return console.error('Game state not found');

      const gameState: TestGameState = JSON.parse(gameStateRaw);
      console.log('Action Game state:', gameState);

      if (!gameState.jobId) {
        console.error('No jobId found in game state');
        return;
      }
      // Update game state
      gameState.turn += 1;
      // Remove old job from queue
      const job = await turnQueue.getJob(gameState.jobId);
      console.log('Found job:', job);
      if (job) await job.remove();

      // Start a new turn job
      const jobId = await startTurn(gameState.roomId);
      if (!jobId) return console.error('Error starting turn job');

      gameState.jobId = jobId;

      // Update Redis game state
      await context.redis.set(
        `gameState:${gameState.roomId}`,
        JSON.stringify(gameState)
      );

      // Broadcast updated game state
      io.to(gameState.roomId).emit('gameState', gameState);
    } catch (err) {
      console.error('Error handling takeAction:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // remove job
    turnQueue.getJob(socket.id).then((job) => job?.remove());
    // remove redis game state
    context.redis.del(`gameState:${socket.id}`);
    // unsubscribe
    context.redisSub.unsubscribe(`channel:gameState:${socket.id}`);
  });
});

context.redisSub.on('message', async (channel, message) => {
  // check if message is from gameState channel
  if (channel.startsWith('channel:gameState:')) {
    const gameState: TestGameState = JSON.parse(message);
    console.log('Subscriber received message:', gameState);
    if (!gameState.roomId) return;
    // start new job
    const jobId = await startTurn(gameState.roomId);
    if (!jobId) return console.error('Error starting turn job');
    // update redis game state
    context.redis.set(
      `gameState:${gameState.roomId}`,
      JSON.stringify({
        ...gameState,
        jobId,
      })
    );
    // broadcast game state
    io.to(gameState.roomId).emit('gameState', gameState);
  }
});

export default app;
