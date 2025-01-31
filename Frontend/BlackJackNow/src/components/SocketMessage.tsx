import { useState } from 'react';
import { useSocket } from '../customHooks/useSocket';

const SocketMessage = () => {
  const { socket } = useSocket();
  const [message, setMessage] = useState('');

  if (!socket) {
    return <div>Loading...</div>;
  }

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('message', (data) => {
    console.log('Received message:', data);
    setMessage(data);
  });

  return (
    <div>
      {socket?.connected ? 'Connected' : 'Disconnected'}
      <p>{message}</p>
      <button onClick={() => socket?.emit('message', 'Hello from the client!')}>
        Send message
      </button>
    </div>
  );
};

export default SocketMessage;

