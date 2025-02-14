import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { registerSocketEvents } from './events';
import { AppContext } from '../context';
import { subscribeToRedisChannel } from './redisSub';
import { Queue } from 'bullmq';

export interface CustomSocket extends Socket {
  roomUrl?: string;
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
    console.log('A user connected:', socket.data.userUid);
    // Create user
    const user = await context.prisma.users.upsert({
      where: { uid: socket.data.userUid },
      update: { uid: socket.data.userUid },
      create: { uid: socket.data.userUid },
    });
    console.log('User created:', user);
    registerSocketEvents(io, socket, context, turnQueue, user);

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      const roomId = (socket as CustomSocket).roomUrl; // Retrieve stored room ID
      if (!roomId) return;
      socket.leave(roomId);
    });
  });

  subscribeToRedisChannel(io, turnQueue, context);

  return io;
};
