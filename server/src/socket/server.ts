import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../services/db';
import { redisSubscriber, redisPublisher } from '../redis/client';

const userSockets = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true }
  });

  // ── Auth middleware for every socket connection ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return next(new Error('JWT_SECRET is not configured'));
      const payload = jwt.verify(token, jwtSecret) as unknown as { userId: string };
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Redis subscriber: fan-out events to WebSocket clients ────
  redisSubscriber.subscribe('chat_events');
  redisSubscriber.on('message', (channel, data) => {
    const event = JSON.parse(data);
    if (event.type === 'NEW_MESSAGE') {
      io.to(`conv:${event.conversationId}`).emit('new_message', event.message);
    }
    if (event.type === 'TYPING') {
      io.to(`conv:${event.conversationId}`).except(event.senderSocketId).emit('user_typing', event);
    }
  });

  // ── Connection handler ───────────────────────────────────────
  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`User ${userId} connected (socket ${socket.id})`);

    // Track this user's socket IDs (multiple tabs)
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);

    // Auto-join all conversations
    const participations = await db.participant.findMany({
      where: { userId }, select: { conversationId: true }
    });
    participations.forEach((p: any) => socket.join(`conv:${p.conversationId}`));

    // Broadcast online status
    await db.user.update({ where: { id: userId }, data: { lastSeen: new Date() } });
    io.emit('presence_update', { userId, status: 'online' });

    // ── Event: typing indicator ─────────────────────────────────
    socket.on('typing_start', ({ conversationId }) => {
      redisPublisher.publish('chat_events', JSON.stringify({
        type: 'TYPING',
        conversationId,
        userId,
        senderSocketId: socket.id,
        isTyping: true,
      }));
    });

    socket.on('typing_stop', ({ conversationId }) => {
      redisPublisher.publish('chat_events', JSON.stringify({
        type: 'TYPING',
        conversationId,
        userId,
        senderSocketId: socket.id,
        isTyping: false,
      }));
    });

    // ── Event: mark messages as read ────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      const unread = await db.message.findMany({
        where: { conversationId, senderId: { not: userId } },
        select: { id: true }
      });
      await Promise.all(unread.map((m: any) =>
        db.messageStatus.upsert({
          where: { messageId_userId: { messageId: m.id, userId } },
          create: { messageId: m.id, userId, status: 'read' },
          update: { status: 'read' },
        })
      ));
      socket.to(`conv:${conversationId}`).emit('messages_read', { userId, conversationId });
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userSocketSet = userSockets.get(userId);
      userSocketSet?.delete(socket.id);
      if (!userSocketSet?.size) {
        userSockets.delete(userId);
        await db.user.update({ where: { id: userId }, data: { lastSeen: new Date() } });
        io.emit('presence_update', { userId, status: 'offline' });
      }
    });
  });

  return io;
}
