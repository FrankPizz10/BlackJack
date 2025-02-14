import { useEffect } from 'react';
import { useSocket } from '../customHooks/useSocket';

const CreateRoom = () => {
  const { socket } = useSocket();

  // Listen for the createRoom event
  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data) => {
      console.log('Room created: ', data);
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

  return (
    <div>
      <button onClick={() => createRoom()}>Create Room</button>
    </div>
  );
};

export default CreateRoom;

