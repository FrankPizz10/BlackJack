import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { registerSocketEvents } from './events';
import { AppContext } from '../context';
import { subscribeToRedisChannel } from './redisSub';
import { Queue } from 'bullmq';

export interface CustomSocket extends Socket {
  roomId?: string;
}

export const initializeSockets = (
  httpServer: HttpServer,
  context: AppContext,
  turnQueue: Queue
): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    registerSocketEvents(io, socket, context, turnQueue);

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      const roomId = (socket as CustomSocket).roomId; // Retrieve stored room ID
      if (!roomId) return;
      socket.leave(roomId);
    });
  });

  subscribeToRedisChannel(io, turnQueue, context);

  return io;
};
