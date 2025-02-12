import { Server, Socket } from 'socket.io';
import { startTurn } from '../services/gameStateService';
import { TestGameState } from '@shared-types/Bullmq/jobs';
import { CustomSocket } from './index';
import { AppContext } from '../context';
import { Queue } from 'bullmq';

export const registerSocketEvents = (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue
) => {
  socket.on('joinRoom', async (data) => {
    console.log('Joining room:', data.roomId);
    // join room
    socket.join(data.roomId);
    // Store the room ID inside socket.data
    (socket as CustomSocket).roomId = data.roomId;
    // start turn
    try {
      await startTurn(data.roomId, turnQueue);
    } catch (err) {
      console.error('Error starting turn job:', err);
    }
    // update redis game state
    try {
      const gameState: TestGameState = { turn: 0, roomId: data.roomId };
      if (!gameState.roomId) return;
      await context.redis.set(
        `gameState:${data.roomId}`,
        JSON.stringify(gameState)
      );
      // broadcast game state
      io.to(data.roomId).emit('gameState', gameState);
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  });

  socket.on('takeAction', async (data) => {
    console.log('Action received:', data);

    if (!data.roomId) return; // Early return if roomId is missing

    try {
      // Get and parse game state
      const gameStateRaw = await context.redis.get(`gameState:${data.roomId}`);
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
