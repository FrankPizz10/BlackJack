import { Server, Socket } from 'socket.io';
import { AppContext } from '../../context';
import { Queue } from 'bullmq';
import { startTurn } from '../../services/gameStateService';
import {
  createNewGameState,
  dealCards,
  GameState,
  handleBet,
  takeAction,
} from '@shared-types/GameState';
import { StartGame } from '@shared-types/db/Game';
import { ActionEvent, Action } from '@shared-types/Action';

export const startGame = async (
  io: Server,
  socket: Socket,
  context: AppContext,
  turnQueue: Queue,
  startGame: StartGame
) => {
  console.log('Starting game...');
  if (!startGame.userRoomDb.host) {
    console.error('User is not host');
    socket.emit('error', 'User is not host');
    return;
  }
  try {
    const gameState = createNewGameState(startGame);
    await context.redis.set(
      `gameState:${startGame.roomDb.url}`,
      JSON.stringify(gameState)
    );
    // Broadcast game started
    io.to(startGame.roomDb.url).emit('gameStarted');
    // broadcast game state
    io.to(startGame.roomDb.url).emit(
      'gameState',
      removeFaceDownCards(gameState)
    );
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
  actionEvent: ActionEvent
) => {
  console.log('Action received:', actionEvent);

  if (!actionEvent.roomUrl) return; // Early return if roomId is missing

  try {
    // Get and parse game state
    const gameStateRaw = await context.redis.get(
      `gameState:${actionEvent.roomUrl}`
    );
    if (!gameStateRaw) return console.error('Game state not found');

    const gameState: GameState = JSON.parse(gameStateRaw);
    console.log('Action Game state:', gameState);
    if (!gameState) return console.error('Game state invalid');
    // Update game state
    const action: Action = {
      actionType: actionEvent.actionType,
      bet: actionEvent.bet,
    };
    const newGameState = takeAction(gameState, action);
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
      io.to(actionEvent.roomUrl).emit('gameState', newGameState);
    } catch (err) {
      console.error('Error updating game state:', err);
    }
    // Check if all hands have bet and cards have not been dealt yet
    if (
      newGameState.seats.every((seat) =>
        seat.hands.every((hand) => hand.bet > 0 && hand.cards.length < 1)
      )
    ) {
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
          removeFaceDownCards(newGameState)
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

// Remove the value of face down cards from gamestate
const removeFaceDownCards = (gameState: GameState) => {
  gameState.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      hand.cards.forEach((card) => {
        if (!card.faceUp) {
          card.card = 'HIDDEN';
          card.suit = 'HIDDEN';
        }
      });
    });
  });
  gameState.dealerHand.forEach((card) => {
    if (!card.faceUp) {
      card.card = 'HIDDEN';
      card.suit = 'HIDDEN';
    }
  });
  gameState.deck.currentDeck.forEach((card) => {
    if (!card.faceUp) {
      card.card = 'HIDDEN';
      card.suit = 'HIDDEN';
    }
  });
  return gameState;
};
