import { useEffect, useState } from 'react';
import { useSocket } from '../customHooks/useSocket';
import { StartGame } from '@shared-types/db/Game';
import { RoomData } from '@shared-types/db/Room';
import { UserRoom } from '@shared-types/db/UserRoom';
import { JoinRoom } from '@shared-types/db/Room';

const TestGame = () => {
  const { socket } = useSocket();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userRoomData, setUserRoomData] = useState<UserRoom | null>(null);
  const [joinRoomData, setJoinRoomData] = useState<JoinRoom | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data: StartGame) => {
      const { roomDb, userRoomDb } = data;
      setRoomData(roomDb);
      setUserRoomData(userRoomDb);
      console.log('Room created: ', data);
    });
    socket.on('roomJoined', (data: UserRoom) => {
      if (data.name === socket.id) {
        setUserRoomData(data);
      }
      console.log('Room joined: ', data);
    });
    socket.on('gameState', (data) => {
      console.log('Received game state:', data);
    });
  }, [socket]);

  if (!socket) {
    return <div>No socket</div>;
  }
  const createRoom = async () => {
    socket.emit('createRoom');
  };

  const startGame = async () => {
    if (!roomData || !userRoomData) return;
    const startGame: StartGame = { roomDb: roomData, userRoomDb: userRoomData };
    console.log('Starting game: ', startGame);
    socket.emit('startGame', startGame);
  };

  const joinRoom = async () => {
    if (!joinRoomData) return;
    console.log('Joining room: ', joinRoomData);
    socket.emit('joinRoom', joinRoomData);
  };

  return (
    <div>
      <button onClick={() => createRoom()}>Create Room</button>
      <button onClick={() => startGame()}>Start Game</button>
      <input
        type="text"
        onChange={(e) => setJoinRoomData({ roomUrl: e.target.value })}
      />
      <button onClick={() => joinRoom()}>Join Room</button>
    </div>
  );
};

export default TestGame;

