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
    const { roomId } = job.data;
    console.log('Turn started for room:', roomId);
    const gameState = await redis.get(`gameState:${roomId}`);
    if (gameState) {
      const parsedGameState = JSON.parse(gameState) as TestGameState;
      parsedGameState.turn += 1;
      await redis.set(`gameState:${roomId}`, JSON.stringify(parsedGameState));
      // Update channel
      await redisPub.publish(
        `channel:gameState:${roomId}`,
        JSON.stringify(parsedGameState)
      );
      console.log('Turn updated for room:', roomId);
    }
  },
  { connection: redis }
);

