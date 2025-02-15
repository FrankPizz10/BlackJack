import { TURN_TIME_LIMIT } from '@shared-types/Bullmq/jobs';
import { Queue } from 'bullmq';

export const startTurn = async (
  roomUrl: string,
  turnQueue: Queue
): Promise<void> => {
  if (!roomUrl) {
    console.error('Room ID is missing');
    return;
  }
  // check if room id can be parsed as an int
  if (!isNaN(parseInt(roomUrl))) {
    console.error('Room ID is not a string');
    return;
  }
  console.log('Starting turn for room:', roomUrl);
  try {
    const existingJob = await turnQueue.getJob(roomUrl);
    if (existingJob) {
      console.log(`Job already exists for room: ${roomUrl}, skipping new job.`);
      return;
    }
  } catch (err) {
    console.error('Error checking for existing job:', err);
    throw 'Error checking for existing job';
  }
  try {
    await turnQueue.add(
      'turn',
      { roomUrl: roomUrl },
      {
        delay: TURN_TIME_LIMIT,
        removeOnComplete: true,
        removeOnFail: true,
        jobId: String(roomUrl),
      }
    );
    console.log(`Turn started for room: ${roomUrl}`);
  } catch (err) {
    console.error('Error starting turn job:', err);
    throw 'Error starting turn job';
  }
};
