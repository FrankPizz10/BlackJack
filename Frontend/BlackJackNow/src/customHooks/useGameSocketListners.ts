import { StartGame } from '@shared-types/db/Game';
import { JoinRoom, RoomData } from '@shared-types/db/Room';
import { RoomWithUsersAndSeats, UserRoom } from '@shared-types/db/UserRoom';
import { UserSeat } from '@shared-types/db/UserSeat';
import { GameState } from '@shared-types/Game/GameState';
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export type DisplayGameState = {
  gameData: GameState | null;
  startBetting: boolean;
  betAmount: number;
};

export type DisplayRoomState = {
  room: RoomData | null;
  userRoom: UserRoom | null;
  userSeats: UserSeat[] | null;
  userSeat: UserSeat | null;
  joinRoom: JoinRoom | null;
};

export const useGameSocketListeners = ({
  setRoomState,
  setGameState,
}: {
  setRoomState: React.Dispatch<React.SetStateAction<DisplayRoomState>>;
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>;
}) => {
  // Define the socket
  const { socket } = useSocket();

  useEffect(() => {
    // Check if socket is available
    if (!socket) return;

    // Define the event handlers
    const onRoomCreated = (data: StartGame) => {
      setRoomState((prev) => ({
        ...prev,
        room: data.roomDb,
        userRoom: data.userRoomDb,
        userSeat: data.userSeatDb,
      }));
      console.log('Room created: ', data);
    };

    const onRoomJoined = (data: RoomWithUsersAndSeats) => {
      const { UserRooms } = data;
      const userRoomDb = UserRooms.find((ur) => ur.name === socket.id);
      const userSeats = data.UserRooms.flatMap((ur) => ur.UserSeats);
      if (!userRoomDb) {
        console.error('User room not found in roomJoined event');
        return;
      }
      setRoomState((prev) => ({
        ...prev,
        room: {
          roomOpenTime: data.roomOpenTime,
          roomCloseTime: data.roomCloseTime,
          maxRoomSize: data.maxRoomSize,
          url: data.url,
          gameTableId: data.gameTableId,
          id: data.id,
        },
        userRoom: {
          id: userRoomDb.id,
          userId: userRoomDb.userId,
          roomId: userRoomDb.roomId,
          host: userRoomDb.host,
          name: userRoomDb.name,
          initialStack: userRoomDb.initialStack,
        },
        userSeats,
      }));
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);
    socket.on('seatTaken', (data: UserSeat) => {
      setRoomState((prev) => {
        if (data.userRoomId === prev.userRoom?.id) {
          return {
            ...prev,
            userSeat: data,
            seatTaken: true,
          };
        }
        return prev;
      });
    });
    socket.on('gameStarted', () =>
      setGameState((prev) => ({ ...prev, startBetting: true }))
    );
    socket.on('betsPlaced', () =>
      setGameState((prev) => ({ ...prev, startBetting: false }))
    );
    socket.on('gameReset', () =>
      setGameState((prev) => ({ ...prev, startBetting: true }))
    );
    socket.on('gameState', (gs: GameState) =>
      setGameState((prev) => ({ ...prev, gameData: gs }))
    );

    // Cleanup function to remove the event listeners
    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('seatTaken');
      socket.off('gameStarted');
      socket.off('betsPlaced');
      socket.off('gameReset');
      socket.off('gameState');
    };
  }, [socket, setRoomState, setGameState]);

  return socket;
};

