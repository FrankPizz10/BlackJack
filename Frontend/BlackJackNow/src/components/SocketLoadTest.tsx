// import { useEffect, useState } from 'react';
// import { useSocket } from '../customHooks/useSocket';
import { TestGameState } from '@shared-types/Bullmq/jobs';
import { io } from 'socket.io-client';

const SocketMessage = () => {
  //   const { socket } = useSocket();
  //   const [roomId, setRoomId] = useState('');
  //   const [input, setInput] = useState('');

  const connectClient = async (roomId: number) => {
    return new Promise((resolve) => {
      const socket = io(import.meta.env.VITE_SERVER_URL);

      socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('joinRoom', { roomId: `room-${roomId}` });
        resolve(socket);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('gameState', (data: TestGameState) => {
        console.log('Received game state:', data);
      });

      socket.on('joinRoom', (data: TestGameState) => {
        console.log('Joined room:', data.roomId);
      });

      socket.on('takeAction', (data: TestGameState) => {
        console.log('Joined room:', data.roomId);
      });
    });
  };

  const startLoadTest = async () => {
    console.log('Starting Load Test...');
    const promisedClients = [];
    // connect to i rooms with j players
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 7; j++) {
        promisedClients.push(connectClient(i));
      }
    }

    await Promise.all(promisedClients);

    console.log('All Clients Connected!');
  };

  //   const joinRoom = (roomId: string) => {
  //     socket.emit('joinRoom', { roomId });
  //     setRoomId(roomId);
  //   };

  //   const takeAction = () => {
  //     socket.emit('takeAction', { roomId });
  //   };

  return (
    <div>
      <button onClick={() => startLoadTest()}>Start Load Test</button>
    </div>
  );
};

export default SocketMessage;

