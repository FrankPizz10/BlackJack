import { Server, Socket } from 'socket.io';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import { CustomSocket } from '../index';
import { createNewGameState } from '@shared-types/GameState';
import { AppContext } from '../../context';
import { createRoom } from '../../services/roomsService';
import { createUserRoom } from '../../services/userRoomService';
import { startTurn } from '../../services/gameStateService';
import { createUserRoomSchema } from '@shared-types/db/UserRoom';
import { TestGameState } from '@shared-types/Bullmq/jobs';

export const handleCreateRoom = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  user: DbUser
) => {
  console.log('Creating new room:');
  // create room
  try {
    const { roomDb } = await createRoom(context);
    console.log('Room created:', roomDb);
    if (!roomDb) return;
    const userRoomData = {
      userId: user.id,
      roomId: roomDb.id,
      host: true,
      name: socket.id,
    };
    const result = createUserRoomSchema.safeParse(userRoomData);
    if (!result.success) {
      console.error('Invalid user room data:', userRoomData);
      return;
    }
    const userRoom = await createUserRoom(context, userRoomData);
    console.log('User room created:', userRoom);
    // join room
    socket.join(roomDb.url);
    io.to(socket.id).emit('roomCreated', { roomDb, userRoom });
    // Store the room ID inside socket.data
    (socket as CustomSocket).roomUrl = roomDb.url;
    // start turn
    try {
      await startTurn(roomDb.url, turnQueue);
    } catch (err) {
      console.error('Error starting turn job:', err);
    }
    // update redis game state
    try {
      const gameState = createNewGameState(roomDb, socket.data);
      await context.redis.set(
        `gameState:${roomDb.url}`,
        JSON.stringify(gameState)
      );
      // broadcast game state
      io.to(roomDb.url).emit('gameState', gameState);
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  } catch (err) {
    console.error('Error creating room:', err);
  }
};

export const handleJoinRoom = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  data: { url: string }
) => {
  if (!data.url) return;
  console.log('Joining room:', data.url);
  // join room
  socket.join(data.url);
  // Store the room ID inside socket.data
  (socket as CustomSocket).roomUrl = data.url;
  // start turn
  try {
    await startTurn(data.url, turnQueue);
  } catch (err) {
    console.error('Error starting turn job:', err);
  }
  // update redis game state
  try {
    const gameState: TestGameState = { turn: 0, roomId: data.url };
    if (!gameState.roomId) return;
    await context.redis.set(`gameState:${data.url}`, JSON.stringify(gameState));
    // broadcast game state
    io.to(data.url).emit('gameState', gameState);
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};
