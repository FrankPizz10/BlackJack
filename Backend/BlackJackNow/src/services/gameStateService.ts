import { TURN_TIME_LIMIT } from '@shared-types/Bullmq/jobs';
import { Queue } from 'bullmq';

export const startTurn = async (
  roomId: string,
  turnQueue: Queue
): Promise<void> => {
  if (!roomId) return;
  // check if room id can be parsed as an int
  if (!isNaN(parseInt(roomId))) return;
  console.log('Starting turn for room:', roomId);
  try {
    const existingJob = await turnQueue.getJob(roomId);
    if (existingJob) {
      console.log(`Job already exists for room: ${roomId}, skipping new job.`);
      return;
    }
  } catch (err) {
    console.error('Error checking for existing job:', err);
    throw 'Error checking for existing job';
  }
  try {
    await turnQueue.add(
      'turn',
      { roomId },
      {
        delay: TURN_TIME_LIMIT,
        removeOnComplete: true,
        removeOnFail: true,
        jobId: String(roomId),
      }
    );
  } catch (err) {
    console.error('Error starting turn job:', err);
    throw 'Error starting turn job';
  }
};
