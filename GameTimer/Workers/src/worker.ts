import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { TestGameState } from '@shared-types/Bullmq/jobs';

dotenv.config();

// Setup redis client
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined');
}

const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisPub = redis.duplicate();

new Worker(
  'turnQueue',
  async (job) => {
    try {
      const { roomId } = job.data;
      console.log('Turn started for room:', roomId);
      // Get game state
      const gameStateRaw = await redis.get(`gameState:${roomId}`);
      if (gameStateRaw) {
        // Update game state
        const gameState: TestGameState = JSON.parse(gameStateRaw);
        if (!gameState) return console.error('Game state invalid');
        gameState.turn += 1;
        // Set game state
        await redis.set(`gameState:${roomId}`, JSON.stringify(gameState));
        // Update channel
        await redisPub.publish(
          `channel:gameStateUpdates`,
          JSON.stringify(gameState)
        );
        console.log(
          `Turn updated for room:${roomId} at ${new Date().toLocaleTimeString()}`
        );
      }
    } catch (error) {
      console.error('Error processing turn job:', error);
    }
  },
  { connection: redis }
);

