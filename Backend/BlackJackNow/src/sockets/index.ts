import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { registerSocketEvents } from './events';
import { AppContext } from '../context';
import { subscribeToRedisChannel } from './redisSub';
import { Queue } from 'bullmq';
import { createUserSchema } from '@shared-types/db/User';

export interface CustomSocket extends Socket {
  roomUrl: Set<string>; // Store the room url inside socket.data
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
    // Verify zod schema
    const socketData = {
      uid: socket.data.userUid,
    };
    const result = createUserSchema.safeParse(socketData);
    if (!result.success) {
      console.error('Invalid user ID:', socketData.uid);
      return;
    }
    // Create user
    const user = await context.prisma.users.upsert({
      where: { uid: socketData.uid },
      update: {},
      create: { uid: socketData.uid },
    });
    console.log('User created:', user);
    registerSocketEvents(io, socket, context, turnQueue, user);

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      // const roomUrl = (socket as CustomSocket).roomUrl; // Retrieve stored room url
      // if (!roomUrl) return;
      // TODO: Remove user from all rooms they were in
    });
  });

  subscribeToRedisChannel(io, turnQueue, context);

  return io;
};
