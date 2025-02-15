import { Server } from 'socket.io';
import { CustomSocket } from '../sockets/index';

export const getUniqueSocketRoomCount = (io: Server) => {
  const roomIds = new Set<string>();

  io.sockets.sockets.forEach((socket) => {
    const customSocket = socket as CustomSocket; // Type assertion
    if (customSocket.roomUrl) {
      // add all ids in the customSocket.roomUrl set to the roomIds set
      customSocket.roomUrl.forEach((roomId) => {
        roomIds.add(roomId);
      });
    }
  });

  return roomIds.size;
};
