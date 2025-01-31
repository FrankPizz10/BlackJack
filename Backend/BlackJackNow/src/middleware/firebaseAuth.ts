import { ExtendedError, Socket } from 'socket.io';
import { admin } from '../services/firebaseService';
import { Request, Response, NextFunction } from 'express';

const retrieveToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return token || null; // Return null if token is undefined
};

// Middleware function to check firebase authentication token
export const firebaseAuthApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    res.locals.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Invalid token:', error);
    res.status(500).json({ error: 'Invalid token' });
  }
};

export const firebaseAuthSocket = (
  socket: Socket,
  next: (err?: ExtendedError) => void
): void => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication token is missing') as ExtendedError);
  }

  // Verify Firebase token asynchronously but ensure next() is called correctly
  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      socket.data.user = decodedToken; // Store user data in socket instance
      next(); // Proceed to the next middleware
    })
    .catch((error) => {
      console.error('Socket authentication failed:', error);
      next(new Error('Authentication failed') as ExtendedError);
    });
};

