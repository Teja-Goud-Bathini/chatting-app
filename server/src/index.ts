
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initSocketServer } from './socket/server';
import { connectRedis } from './redis/client';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Middleware ───────────────────────────────
app.use(helmet());         // Security headers
app.use(morgan('dev'));    // Request logging
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,       // Allow cookies cross-origin
}));
app.use(express.json());   // Parse JSON bodies

// ─── Routes ───────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', chatRoutes);
app.use('/api/messages', messageRoutes);

// ─── Error handler (must be last middleware) ──
app.use(errorHandler);

// ─── Start everything ─────────────────────────
const PORT = process.env.PORT || 3001;

async function start() {
  await connectRedis();
  initSocketServer(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();