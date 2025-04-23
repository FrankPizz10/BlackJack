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

export const createRoom = (socket: Socket) => {
  console.log('Creating room');
  socket.emit('createRoom');
};

export const startGame = (socket: Socket, roomUrl: string) => {
  const event: Event = { roomUrl };
  console.log('Starting game: ', event);
  socket.emit('startGame', event);
};

export const joinRoom = (socket: Socket, joinRoomData: JoinRoom) => {
  console.log('Joining room: ', joinRoomData);
  socket.emit('joinRoom', joinRoomData);
};

export const takeAction = (
  socket: Socket,
  actionType: ActionType,
  roomUrl: string,
  userSeat: UserSeat | null,
  betAmount: number,
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>
) => {
  if (!userSeat) return;

  const seatIndex = positionHelper(userSeat);
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
      setGameState((prev) => ({ ...prev, startBetting: true }));
      action = baseAction;
      break;
    default:
      action = baseAction;
  }

  console.log(`Action ${actionType}: `, action);
  socket.emit('takeAction', action);
};

export const handleBetAmount = (
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>,
  amount: string
) => {
  setGameState((prev) => ({
    ...prev,
    betAmount: parseInt(amount),
  }));
};

export const takeSeat = (socket: Socket, roomState: DisplayRoomState) => {
  if (!roomState.room || !roomState.userRoom) return;
  const seatPosition = roomState.userSeats ? roomState.userSeats.length + 1 : 1;
  const takeSeat: TakeSeat = {
    roomUrl: roomState.room.url,
    seatPosition: seatPosition,
    userRoomId: roomState.userRoom.id,
  };
  console.log('Taking seat: ', takeSeat);
  socket.emit('takeSeat', takeSeat);
};

