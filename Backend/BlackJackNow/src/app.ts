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

const startTurn = async (roomId: string) => {
  if (!roomId) return;
  await turnQueue.add(
    'turn',
    { roomId },
    { delay: TURN_TIME_LIMIT, removeOnComplete: true, removeOnFail: true }
  );
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  const gameState: TestGameState = { turn: 0, roomId: socket.id };
  // update game state
  context.redis.set(`gameState:${socket.id}`, JSON.stringify(gameState));
  // subscribe to a redis channel
  context.redisSub.subscribe(`channel:gameState:${socket.id}`, (err) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    }
    console.log(`Subscribed to channel:gameState:${socket.id}`);
  });
  socket.join(socket.id);
  startTurn(socket.id);

  socket.on('message', (data) => {
    console.log('Message received:', data);
    io.emit('message', data); // Broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

context.redisSub.on('message', (channel, message) => {
  if (channel.startsWith('channel:gameState:')) {
    const gameState = JSON.parse(message);
    console.log('Subscriber received message:', gameState);
    io.to(gameState.roomId).emit('gameState', gameState);
    startTurn(gameState.roomId);
  }
});

export default app;
