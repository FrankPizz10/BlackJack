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
import { Queue, Worker } from 'bullmq';

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

const TURN_TIME_LIMIT = 30000; // 30 seconds

const startTurn = async (room: string) => {
  if (!room) return;
  await turnQueue.add(
    'turn',
    { room },
    { delay: TURN_TIME_LIMIT, removeOnComplete: true, removeOnFail: true }
  );
};

const worker = new Worker(
  'turnQueue',
  async (job) => {
    const { room } = job.data;
    // broadcast a message to all sockets
    io.to(room).emit(`timer reset for room:${room}`);
    await startTurn(room);
  },
  { connection: context.redis }
);

// let timers = new Map<string, NodeJS.Timeout>();
// const resetTime = 60 * 1000; // 1 minute

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // for (let i = 0; i < 10; i++) {
  //   socket.join(i.toString());
  //   startTurn(i.toString());
  // }
  socket.join(socket.id);
  startTurn(socket.id);
  // const startTimer = () => {
  //   const timer = setTimeout(() => {
  //     io.to(socket.id).emit('timer reset');
  //     startTimer(); // Restart the timer after sending the event
  //   }, resetTime / 10); // 10 secs

  //   timers.set(socket.id, timer);
  // };

  // // Start the repeating timer
  // startTimer();

  socket.on('message', (data) => {
    console.log('Message received:', data);
    io.emit('message', data); // Broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export default app;
