import { Server, Socket } from 'socket.io';
import { AppContext } from '../context';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import { handleCreateRoom, handleJoinRoom } from './handlers/roomHandlers';
import { handleTakeAction, startGame } from './handlers/gameHandlers';
import { StartGame, startGameSchema } from '@shared-types/db/Game';
import { JoinRoom, joinRoomSchema } from '@shared-types/db/Room';

export const registerSocketEvents = (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  user: DbUser
) => {
  socket.on('createRoom', () => {
    handleCreateRoom(io, socket, context, user);
  });
  socket.on('startGame', (data: StartGame) => {
    const result = startGameSchema.safeParse(data);
    if (!result.success) {
      console.error('Invalid game data:', data);
      socket.emit('error', 'Invalid game data');
    }
    startGame(io, socket, context, turnQueue, data);
  });
  socket.on('joinRoom', (data: JoinRoom) => {
    const result = joinRoomSchema.safeParse(data);
    if (!result.success) {
      console.error('Invalid join room data:', data);
      socket.emit('error', 'Invalid join room data');
    }
    handleJoinRoom(io, socket, context, user, data);
  });
  socket.on('takeAction', (data: { url: string }) => {
    handleTakeAction(io, context, turnQueue, data);
  });
};
