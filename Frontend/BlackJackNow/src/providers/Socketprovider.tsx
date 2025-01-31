import { getIdToken, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../services/auth/firebaseAuthConfig';
import { SocketContext } from './SocketContext'; // Import the context

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
        const token = await getIdToken(user);
        newSocket = io(import.meta.env.VITE_SERVER_URL, {
          auth: { token },
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    };

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

