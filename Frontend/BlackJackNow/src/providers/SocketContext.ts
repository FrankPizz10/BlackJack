import { createContext } from 'react';
import { Socket } from 'socket.io-client';

// Define the type for our context value
export interface SocketContextType {
  socket: Socket | null;
}

// Create the context with an initial value of null
export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

