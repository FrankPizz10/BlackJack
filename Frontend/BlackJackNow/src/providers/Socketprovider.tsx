import { getIdToken, onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../services/auth/firebaseAuthConfig';

// Define the type for our context value
interface SocketContextType {
  socket: Socket | null;
}

// Create the context with an initial value of null
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Provider component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let newSocket: Socket | null = null;

    const initializeSocket = async (user: User | null) => {
      if (!user) return;

      try {
        const token = await getIdToken(user); // Get the Firebase token
        newSocket = io(import.meta.env.VITE_SERVER_URL, {
          auth: { token }, // No need for 'Bearer' prefix with Socket.io
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    };

    // Listen for auth state changes and initialize socket accordingly
    const unsubscribe = onAuthStateChanged(auth, initializeSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for consuming the context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

