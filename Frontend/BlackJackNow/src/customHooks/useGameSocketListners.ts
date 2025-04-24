import { StartGame } from '@shared-types/db/Game';
import { JoinRoom, RoomData } from '@shared-types/db/Room';
import { RoomWithUsersAndSeats, UserRoom } from '@shared-types/db/UserRoom';
import { UserSeat } from '@shared-types/db/UserSeat';
import { GameState } from '@shared-types/Game/GameState';
import { useEffect } from 'react';
import { useSocket } from './useSocket';

// Type that holds the state of the game for display purposes
export type DisplayGameState = {
  gameData: GameState | null; // The current state of the game (e.g., cards, players)
  startBetting: boolean; // Whether players can place bets
  betAmount: number; // Current bet amount
};

// Type that holds the state of the room and user for display purposes
export type DisplayRoomState = {
  room: RoomData | null; // Information about the current game room
  userRoom: UserRoom | null; // Info about the current user's room assignment
  userSeats: UserSeat[] | null; // All seats in the room
  userSeat: UserSeat | null; // Seat assigned to this user
  joinRoom: JoinRoom | null; // Data used when the user is joining a room
};

// Hook that sets up WebSocket listeners for game-related events
export const useGameSocketListeners = ({
  setRoomState,
  setGameState,
}: {
  setRoomState: React.Dispatch<React.SetStateAction<DisplayRoomState>>;
  setGameState: React.Dispatch<React.SetStateAction<DisplayGameState>>;
}) => {
  // Get the socket instance from the custom hook
  const { socket } = useSocket();

  useEffect(() => {
    // Exit early if socket is not ready
    if (!socket) return;

    // Listener: when a room is created, update the room state
    const onRoomCreated = (data: StartGame) => {
      setRoomState((prev) => ({
        ...prev,
        room: data.roomDb,
        userRoom: data.userRoomDb,
        userSeat: data.userSeatDb,
      }));
      console.log('Room created: ', data);
    };

    // Listener: when a user joins a room, update the full room state including users and seats
    const onRoomJoined = (data: RoomWithUsersAndSeats) => {
      const { UserRooms } = data;

      // Find the current user's room info using their socket ID
      const userRoomDb = UserRooms.find((ur) => ur.name === socket.id);
      const userSeats = data.UserRooms.flatMap((ur) => ur.UserSeats);

      if (!userRoomDb) {
        console.error('User room not found in roomJoined event');
        return;
      }

      // Update state with room and user information
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

    // Register all socket event listeners
    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);

    // Listener: triggered when a seat is taken
    socket.on('seatTaken', (data: UserSeat) => {
      setRoomState((prev) => {
        // Only update if the taken seat is the current user's
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

    // Listener: game has started, enable betting
    socket.on('gameStarted', () =>
      setGameState((prev) => ({ ...prev, startBetting: true }))
    );

    // Listener: all bets placed, stop betting
    socket.on('betsPlaced', () =>
      setGameState((prev) => ({ ...prev, startBetting: false }))
    );

    // Listener: game has been reset, allow betting again
    socket.on('gameReset', () =>
      setGameState((prev) => ({ ...prev, startBetting: true }))
    );

    // Listener: update the current game state
    socket.on('gameState', (gs: GameState) =>
      setGameState((prev) => ({ ...prev, gameData: gs }))
    );

    // Cleanup all listeners on component unmount or socket change
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

