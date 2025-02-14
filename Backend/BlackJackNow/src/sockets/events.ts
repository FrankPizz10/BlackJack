import { Server, Socket } from 'socket.io';
import { AppContext } from '../context';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import { handleCreateRoom, handleJoinRoom } from './handlers/roomHandlers';
import { handleTakeAction } from './handlers/gameHandlers';

export const registerSocketEvents = (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  user: DbUser
) => {
  socket.on('createRoom', () => {
    handleCreateRoom(io, socket, context, turnQueue, user);
  });
  socket.on('joinRoom', (data: { url: string }) => {
    handleJoinRoom(io, socket, context, turnQueue, data);
  });
  socket.on('takeAction', (data: { url: string }) => {
    handleTakeAction(io, context, turnQueue, data);
  });
};
