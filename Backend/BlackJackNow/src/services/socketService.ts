import { Server } from 'socket.io';
import { CustomSocket } from '../sockets/index';

export const getUniqueSocketRoomCount = (io: Server) => {
  const roomIds = new Set<string>();

  io.sockets.sockets.forEach((socket) => {
    const customSocket = socket as CustomSocket; // Type assertion
    if (customSocket.roomUrl) {
      roomIds.add(customSocket.roomUrl); // Collect unique room IDs
    }
  });

  return roomIds.size;
};
