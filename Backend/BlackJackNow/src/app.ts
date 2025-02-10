import express from 'express';
import roomsRouter from './routes/rooms';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swaggerConfig';
import rootRouter from './routes/root';
import dotenv from 'dotenv';
import { createContext } from './context';
import { Server, Socket } from 'socket.io';
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

const startTurn = async (roomId: string): Promise<void> => {
  if (!roomId) return;
  console.log('Starting turn for room:', roomId);
  try {
    const existingJob = await turnQueue.getJob(roomId);
    if (existingJob) {
      console.log(`Job already exists for room: ${roomId}, skipping new job.`);
      return;
    }
  } catch (err) {
    console.error('Error checking for existing job:', err);
    throw 'Error checking for existing job';
  }
  try {
    await turnQueue.add(
      'turn',
      { roomId },
      {
        delay: TURN_TIME_LIMIT,
        removeOnComplete: true,
        removeOnFail: true,
        jobId: String(roomId),
      }
    );
  } catch (err) {
    console.error('Error starting turn job:', err);
    throw 'Error starting turn job';
  }
};

// subscribe to a redis channel
context.redisSub.subscribe(`channel:gameStateUpdates`, (err) => {
  if (err) {
    console.error('Error subscribing to channel:', err);
  }
  console.log(`Subscribed to channel:gameStateUpdates`);
});

interface CustomSocket extends Socket {
  roomId?: string;
}

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async (data) => {
    console.log('Joining room:', data.roomId);
    // join room
    socket.join(data.roomId);
    // Store the room ID inside socket.data
    (socket as CustomSocket).roomId = data.roomId;
    // start turn
    try {
      await startTurn(data.roomId);
    } catch (err) {
      console.error('Error starting turn job:', err);
    }
    // update redis game state
    try {
      const gameState: TestGameState = { turn: 0, roomId: data.roomId };
      if (!gameState.roomId) return;
      await context.redis.set(
        `gameState:${data.roomId}`,
        JSON.stringify(gameState)
      );
      // broadcast game state
      io.to(data.roomId).emit('gameState', gameState);
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  });

  socket.on('takeAction', async (data) => {
    console.log('Action received:', data);

    if (!data.roomId) return; // Early return if roomId is missing

    try {
      // Get and parse game state
      const gameStateRaw = await context.redis.get(`gameState:${data.roomId}`);
      if (!gameStateRaw) return console.error('Game state not found');

      const gameState: TestGameState = JSON.parse(gameStateRaw);
      console.log('Action Game state:', gameState);
      if (!gameState) return console.error('Game state invalid');
      // Update game state
      gameState.turn += 1;
      // Remove old job from queue
      const job = await turnQueue.getJob(gameState.roomId);
      console.log('Found job:', job);
      if (job) await job.remove();

      // Start a new turn job
      try {
        await startTurn(gameState.roomId);
      } catch (err) {
        console.error('Error starting turn job:', err);
        return;
      }

      // Update Redis game state
      try {
        await context.redis.set(
          `gameState:${gameState.roomId}`,
          JSON.stringify(gameState)
        );

        // Broadcast updated game state
        io.to(gameState.roomId).emit('gameState', gameState);
      } catch (err) {
        console.error('Error updating game state:', err);
      }
    } catch (err) {
      console.error('Error handling takeAction:', err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const roomId = (socket as CustomSocket).roomId; // Retrieve stored room ID
    if (!roomId) return;
    socket.leave(roomId);
  });
});

context.redisSub.on('message', async (channel, message) => {
  // check if message is from gameState channel
  if (channel === 'channel:gameStateUpdates') {
    const gameState: TestGameState = JSON.parse(message);
    console.log('Subscriber received message:', gameState);
    if (!gameState.roomId) return;
    // start new job
    try {
      await startTurn(gameState.roomId);
    } catch (err) {
      console.error('Error starting turn job:', err);
      return;
    }
    // broadcast game state
    io.to(gameState.roomId).emit('gameState', gameState);
  }
});

export default app;
