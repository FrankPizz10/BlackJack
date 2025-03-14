import express from 'express';
import roomsRouter from './routes/rooms';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swaggerConfig';
import rootRouter from './routes/root';
import dotenv from 'dotenv';
import { createContext } from './context';
import { createServer } from 'http';
import {
  createFirebaseAuthApi,
  createFirebaseAuthSocket,
} from './middleware/firebaseAuth';
import { Queue } from 'bullmq';
import { initializeSockets } from './sockets';
import socketRouter from './routes/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const context = createContext();

app.use(rootRouter);
app.use('/api/rooms', roomsRouter(context));

const turnQueue = new Queue('turnQueue', { connection: context.redis });

const io = initializeSockets(httpServer, context, turnQueue);

app.use('/dev/socket', socketRouter(io));

// Enable Swagger UI only in development
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
}

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

if (process.env.DISABLE_MIDDLEWARE !== 'true') {
  // Use firebase middleware if not disabled
  app.use('/api', createFirebaseAuthApi(context));
  io.use(createFirebaseAuthSocket(context));
}

export default app;
