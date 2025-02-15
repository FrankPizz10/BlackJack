import { Server, Socket } from 'socket.io';
import { AppContext } from '../../context';
import { Queue } from 'bullmq';
import { TestGameState } from '@shared-types/Bullmq/jobs';
import { startTurn } from '../../services/gameStateService';
import { createNewGameState } from '@shared-types/GameState';
import { StartGame } from '@shared-types/db/Game';

export const startGame = async (
  io: Server,
  context: AppContext,
  turnQueue: Queue,
  startGame: StartGame
) => {
  console.log('Starting game...');
  try {
    const gameState = createNewGameState(startGame);
    await context.redis.set(
      `gameState:${startGame.roomDb.url}`,
      JSON.stringify(gameState)
    );
    // broadcast game state
    io.to(startGame.roomDb.url).emit('gameState', gameState);
    // start turn
    try {
      await startTurn(startGame.roomDb.url, turnQueue);
    } catch (err) {
      console.error('Error starting turn job:', err);
    }
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};

export const handleTakeAction = async (
  io: Server,
  context: AppContext,
  turnQueue: Queue,
  data: { url: string }
) => {
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
};
