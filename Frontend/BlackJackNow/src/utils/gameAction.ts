import { TakeSeat } from '@shared-types/db/Room';
import { ActionEvent, Event } from '@shared-types/Game/Action';
import { ActionType } from '@shared-types/Game/ActionType';
import { JoinRoom } from '@shared-types/db/Room';
import { UserSeat } from '@shared-types/db/UserSeat';
import { positionHelper } from '@shared-types/Game/utils';
import {
  DisplayGameState,
  DisplayRoomState,
} from '@/customHooks/useGameSocketListners';
import { Socket } from 'socket.io-client';

/**
 * Emits a request to the server to create a new game room.
 * @param socket - The socket instance to communicate with the server.
 */
export const createRoom = (socket: Socket) => {
  console.log('Creating room');
  socket.emit('createRoom');
};

/**
 * Emits a request to start the game in a specific room.
 * @param socket - The socket instance to communicate with the server.
 * @param roomUrl - The URL of the room to start the game in.
 */
export const startGame = (socket: Socket, roomUrl: string) => {
  const event: Event = { roomUrl };
  console.log('Starting game: ', event);
  socket.emit('startGame', event);
};

/**
 * Emits a request to join a game room.
 * @param socket - The socket instance to communicate with the server.
 * @param joinRoomData - The data required to join the room, including room URL and user ID.
 */
export const joinRoom = (socket: Socket, joinRoomData: JoinRoom) => {
  console.log('Joining room: ', joinRoomData);
  socket.emit('joinRoom', joinRoomData);
};

/**
 * Handles the logic for sending an action in the game (e.g., Bet, Fold, Reset).
 * Constructs the action payload based on the type and current seat state.
 * Also updates game state if the action type is 'Reset'.
 * @param socket - The socket instance to communicate with the server.
 * @param actionType - The type of action to take (e.g., Bet, Fold, Reset).
 * @param roomUrl - The URL of the room where the action is taking place.
 * @param userSeat - The user's current seat in the game.
 * @param betAmount - The amount to bet (only relevant for Bet action).
 * @param setGameState - Function to update the local game state.
 */
export const takeAction = (
  socket: Socket,
  actionType: ActionType,
  roomUrl: string,
  userSeat: UserSeat | null,
  betAmount: number,
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>
) => {
  if (!userSeat) return; // Ensure user is seated before acting

  const seatIndex = positionHelper(userSeat); // Determine player's seat index
  const baseAction = {
    roomUrl,
    actionType,
    bet: null,
    seatIndex,
    handIndex: 0,
  };

  let action: ActionEvent;

  switch (actionType) {
    case 'Bet':
      action = {
        ...baseAction,
        bet: {
          betAmount,
          bettingSeat: seatIndex,
        },
      };
      break;
    case 'Reset':
      setGameState((prev) => ({ ...prev, startBetting: true })); // Restart betting phase
      action = baseAction;
      break;
    default:
      action = baseAction;
  }

  console.log(`Action ${actionType}: `, action);
  socket.emit('takeAction', action); // Emit the action to the server
};

/**
 * Updates the local game state with a new bet amount.
 * Triggered when the user inputs a different bet.
 * @param setGameState - Function to update the local game state.
 * @param amount - The new bet amount as a string.
 */
export const handleBetAmount = (
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>,
  amount: string
) => {
  setGameState((prev) => ({
    ...prev,
    betAmount: parseInt(amount),
  }));
};

/**
 * Emits a request to take a seat in the current room.
 * Calculates seat position based on the number of already taken seats.
 * @param socket - The socket instance to communicate with the server.
 * @param roomState - The current state of the room, including user and seat information.
 */
export const takeSeat = (socket: Socket, roomState: DisplayRoomState) => {
  if (!roomState.room || !roomState.userRoom) return; // Ensure valid state before proceeding

  // Determine next seat position (1-based index)
  const seatPosition = roomState.userSeats ? roomState.userSeats.length + 1 : 1;

  const takeSeat: TakeSeat = {
    roomUrl: roomState.room.url,
    seatPosition: seatPosition,
    userRoomId: roomState.userRoom.id,
  };

  console.log('Taking seat: ', takeSeat);
  socket.emit('takeSeat', takeSeat); // Emit seat request to server
};

