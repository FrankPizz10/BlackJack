import { Server, Socket } from 'socket.io';
import { startTurn } from '../services/gameStateService';
import { TestGameState } from '@shared-types/Bullmq/jobs';
import { CustomSocket } from './index';
import { AppContext } from '../context';
import { Queue } from 'bullmq';
import { createRoom } from '../services/roomsService';
import { createNewGameState } from '@shared-types/GameState';
import { createUserRoom } from '../services/userRoomService';
import { DbUser } from '@shared-types/db/User';
import { createUserRoomSchema } from '@shared-types/db/UserRoom';

export const registerSocketEvents = (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  user: DbUser
) => {
  socket.on('createRoom', async () => {
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
  });
  socket.on('joinRoom', async (data: { url: string }) => {
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
      await context.redis.set(
        `gameState:${data.url}`,
        JSON.stringify(gameState)
      );
      // broadcast game state
      io.to(data.url).emit('gameState', gameState);
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  });

  socket.on('takeAction', async (data: { url: string }) => {
    console.log('Action received:', data);

    if (!data.url) return; // Early return if roomId is missing

    try {
      // Get and parse game state
      const gameStateRaw = await context.redis.get(`gameState:${data.url}`);
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
        await startTurn(gameState.roomId, turnQueue);
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
};
