import { Server, Socket } from 'socket.io';
import { AppContext } from '../../context';
import { Queue } from 'bullmq';
import { startTurn } from '../../services/gameStateService';
import {
  createNewGameState,
  dealCards,
  GameState,
  removeFaceDownCards,
  checkDealReady,
  takeAction,
} from '@shared-types/Game/GameState';
import { ActionEvent, Action } from '@shared-types/Game/Action';
import { RoomWithUsersAndSeats } from '@shared-types/db/UserRoom';
import { isAuthorizedGameAction } from '../../middleware/gameAuthorization';
import { getRoomInfoByUrl } from '../../services/roomsService';

export const startGame = async (
  io: Server,
  context: AppContext,
  turnQueue: Queue,
  roomWithUsersAndSeats: RoomWithUsersAndSeats
) => {
  console.log('Starting game...');
  try {
    const gameState = createNewGameState(roomWithUsersAndSeats);
    await context.redis.set(
      `gameState:${roomWithUsersAndSeats.url}`,
      JSON.stringify(gameState)
    );
    // Broadcast game started
    io.to(roomWithUsersAndSeats.url).emit('gameStarted');
    // broadcast game state
    io.to(roomWithUsersAndSeats.url).emit(
      'gameState',
      removeFaceDownCards(gameState)
    );
    // start turn
    try {
      await startTurn(roomWithUsersAndSeats.url, turnQueue);
    } catch (err) {
      console.error('Error starting turn job:', err);
    }
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};

export const handleTakeAction = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  actionEvent: ActionEvent
) => {
  console.log('Action received:', actionEvent);
  try {
    // Get and parse game state
    const gameStateRaw = await context.redis.get(
      `gameState:${actionEvent.roomUrl}`
    );
    if (!gameStateRaw) return console.error('Game state not found');

    const gameState: GameState = JSON.parse(gameStateRaw);
    if (!gameState) return console.error('Game state invalid');
    // Update game state
    const action: Action = {
      actionType: actionEvent.actionType,
      bet: actionEvent.bet,
      seatIndex: actionEvent.seatIndex,
      handIndex: actionEvent.handIndex,
    };
    const roomWithUsersAndSeats = await getRoomInfoByUrl(
      context,
      actionEvent.roomUrl
    );
    if (
      !isAuthorizedGameAction(
        socket.data.userId,
        actionEvent,
        gameState,
        roomWithUsersAndSeats
      )
    ) {
      console.error('Unauthorized action');
      io.to(actionEvent.roomUrl).emit('error', 'Unauthorized action');
      return;
    }
    const { gs: newGameState, actionSuccess } = takeAction(gameState, action);
    if (!actionSuccess) {
      console.error('Action failed');
      io.to(actionEvent.roomUrl).emit('error', 'Action failed');
      return;
    }
    // Remove old job from queue
    const job = await turnQueue.getJob(actionEvent.roomUrl);
    console.log('Found job with id:', job?.id);
    if (job) await job.remove();

    // Update Redis game state
    try {
      await context.redis.set(
        `gameState:${actionEvent.roomUrl}`,
        JSON.stringify(newGameState)
      );

      // Broadcast updated game state
      io.to(actionEvent.roomUrl).emit(
        'gameState',
        removeFaceDownCards(newGameState)
      );
      if (actionEvent.actionType === 'Reset') {
        io.to(actionEvent.roomUrl).emit('gameReset');
      }
    } catch (err) {
      console.error('Error updating game state:', err);
    }
    // Check if all hands have bet and cards have not been dealt yet
    if (checkDealReady(newGameState)) {
      // Broadcast bets have been placed
      io.to(actionEvent.roomUrl).emit('betsPlaced');

      // Deal cards
      try {
        const dealtGameState = dealCards(newGameState);
        await context.redis.set(
          `gameState:${actionEvent.roomUrl}`,
          JSON.stringify(dealtGameState)
        );
        io.to(actionEvent.roomUrl).emit('cardsDealt');
        io.to(actionEvent.roomUrl).emit(
          'gameState',
          removeFaceDownCards(dealtGameState)
        );
      } catch (err) {
        console.error('Error dealing cards:', err);
      }
    }

    // Start a new turn job
    try {
      await startTurn(actionEvent.roomUrl, turnQueue);
    } catch (err) {
      console.error('Error starting turn job:', err);
      return;
    }
  } catch (err) {
    console.error('Error handling takeAction:', err);
  }
};
