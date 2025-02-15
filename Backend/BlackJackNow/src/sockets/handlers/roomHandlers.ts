import { Server, Socket } from 'socket.io';
import { Queue } from 'bullmq';
import { DbUser } from '@shared-types/db/User';
import { CustomSocket } from '../index';
import { AppContext } from '../../context';
import { createRoom } from '../../services/roomsService';
import { createUserRoom } from '../../services/userRoomService';
import { startTurn } from '../../services/gameStateService';
import { createUserRoomSchema } from '@shared-types/db/UserRoom';
import { TestGameState } from '@shared-types/Bullmq/jobs';
import { StartGame } from '@shared-types/db/Game';

export const handleCreateRoom = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  user: DbUser
) => {
  console.log('Creating new room:');
  // create room
  try {
    const { roomDb } = await createRoom(context);
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
    console.log('Joining room:', roomDb.url);
    socket.join(roomDb.url);
    const startGame: StartGame = { roomDb, userRoomDb: userRoom };
    io.to(socket.id).emit('roomCreated', startGame);
    // Store the room url inside socket.data
    (socket as CustomSocket).roomUrl.add(roomDb.url);
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
  (socket as CustomSocket).roomUrl.add(data.url);
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
