import { useEffect, useState } from 'react';
import { useSocket } from '../customHooks/useSocket';

const SocketMessage = () => {
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState('');
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      console.log('Socket connected');
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
    };

    const onJoinRoom = (data: any) => {
      console.log('Joined room:', data.roomId);
      setRoomId(data.roomId);
    };

    const onGameState = (data: any) => {
      console.log('Received game state:', data);
    };

    socket.on('connect', onConnect);

    socket.on('disconnect', onDisconnect);

    socket.on('joinRoom', onJoinRoom);

    socket.on('gameState', onGameState);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('joinRoom', onJoinRoom);
      socket.off('gameState', onGameState);
    };
  }, [socket]);

  if (!socket) {
    return <div>Socket is not connected</div>;
  }

  const joinRoom = (roomId: string) => {
    socket.emit('joinRoom', { roomId });
    setRoomId(roomId);
  };

  const takeAction = () => {
    socket.emit('takeAction', { roomId });
  };

  return (
    <div>
      {roomId && (
        <>
          <p>Joined room: {roomId}</p>
          <button onClick={() => takeAction()}>Take Action</button>
        </>
      )}
      {!roomId && (
        <>
          <p>Please enter a room ID:</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <br />
          <button onClick={() => joinRoom(input)}>Join Room</button>
        </>
      )}
    </div>
  );
};

export default SocketMessage;

