import { ExtendedError, Socket } from 'socket.io';
import { admin } from '../services/firebaseService';
import { Request, Response, NextFunction } from 'express';
import { CustomSocket } from '../sockets/index';
import { AppContext } from '../context';
import { getUserIdFromToken } from '../services/userService';

const retrieveToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return token || null; // Return null if token is undefined
};

// Middleware function to check firebase authentication token
export const createFirebaseAuthApi =
  (context: AppContext) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = retrieveToken(req);
      if (!token) {
        res.status(401).json({ error: 'Missing authentication token' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      res.locals.userId = await getUserIdFromToken(context, decodedToken.uid);
      res.locals.userUid = decodedToken.uid;
      return next();
    } catch (error) {
      console.error('Invalid token:', error);
      res.status(500).json({ error: 'Invalid token' });
    }
  };

export const createFirebaseAuthSocket =
  (context: AppContext) =>
  async (
    socket: Socket,
    next: (err?: ExtendedError) => void
  ): Promise<void> => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error('Authentication token is missing') as ExtendedError
        );
      }

      const decodedToken = await admin.auth().verifyIdToken(token);

      if (!decodedToken) {
        return next(new Error('Invalid token') as ExtendedError);
      }

      socket.data.userId = await getUserIdFromToken(context, decodedToken.uid);
      socket.data.userUid = decodedToken.uid;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Authentication failed') as ExtendedError);
    }
  };
