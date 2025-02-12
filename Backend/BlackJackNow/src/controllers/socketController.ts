import { Server } from 'socket.io';
import { Request, Response } from 'express';
import { getUniqueSocketRoomCount } from '../services/socketService';

export const getTotalActiveSocketConnections = (io: Server) => {
  return (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Total active socket connections',
      count: io.engine.clientsCount,
    });
  };
};

export const getTotalActiveRooms = (io: Server) => {
  return (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Total active rooms',
      count: getUniqueSocketRoomCount(io),
    });
  };
};

