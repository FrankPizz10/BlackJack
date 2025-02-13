import { TestGameState } from '@shared-types/Bullmq/jobs';
import { Server } from 'socket.io';
import { AppContext } from '../context';
import { startTurn } from '../services/gameStateService';
import { Queue } from 'bullmq';

export const subscribeToRedisChannel = (
  io: Server,
  turnQueue: Queue,
  context: AppContext
) => {
  // subscribe to a redis channel
  context.redisSub.subscribe(`channel:gameStateUpdates`, (err) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    }
    console.log(`Subscribed to channel:gameStateUpdates`);
  });

  context.redisSub.on('message', async (channel, message) => {
    // check if message is from gameState channel
    if (channel === 'channel:gameStateUpdates') {
      const gameState: TestGameState = JSON.parse(message);
      console.log('Subscriber received message:', gameState);
      if (!gameState.roomId) return;
      // start new job
      try {
        await startTurn(gameState.roomId, turnQueue);
      } catch (err) {
        console.error('Error starting turn job:', err);
        return;
      }
      // broadcast game state
      io.to(gameState.roomId).emit('gameState', gameState);
    }
  });
};
