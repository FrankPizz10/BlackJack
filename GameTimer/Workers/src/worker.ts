import { QueueEvents, Worker } from 'bullmq';
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
  async (job): Promise<TestGameState | undefined> => {
    try {
      const { roomId } = job.data;
      console.log('Turn started for room:', roomId);

      // Get game state
      const gameStateRaw = await redis.get(`gameState:${roomId}`);
      if (!gameStateRaw) {
        console.error('Game state invalid or missing');
        return undefined;
      }

      // Update game state
      const gameState: TestGameState = JSON.parse(gameStateRaw);
      gameState.turn += 1;

      // Set game state
      await redis.set(`gameState:${roomId}`, JSON.stringify(gameState));

      console.log(
        `Turn updated for room:${roomId} at ${new Date().toLocaleTimeString()}`
      );

      return gameState;
    } catch (error) {
      console.error('Error processing turn job:', error);
      return undefined;
    }
  },
  { connection: redis }
);

// Listen for job completion and publish after full completion
const queueEvents = new QueueEvents('turnQueue', { connection: redis });

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  console.log(
    `Job ${jobId} completed. With return value: ${JSON.stringify(
      returnvalue
    )}. Publishing update...`
  );

  if (!returnvalue) {
    console.error(`Failed to process return value for job ${jobId}`);
    return;
  }

  try {
    // Parse return value
    const gameState = returnvalue as unknown as TestGameState;

    console.log(`Parsed game state for room:${gameState.roomId}`);

    await redisPub.publish(
      `channel:gameStateUpdates`,
      JSON.stringify(gameState)
    );
  } catch (error) {
    console.error(`Failed to process return value for job ${jobId}:`, error);
  }
});

