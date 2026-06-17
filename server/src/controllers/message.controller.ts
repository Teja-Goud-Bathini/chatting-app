import { Request, Response } from 'express';
import { db } from '../services/db';
import { redisPublisher } from '../redis/client';

export async function sendMessage(req: Request, res: Response) {
  const { conversationId, content, type = 'text', mediaUrl, replyToId } = req.body;
  const senderId = req.user!.id;

  // 1. Verify sender is a participant
  const participant = await db.participant.findUnique({
    where: { userId_conversationId: { userId: senderId, conversationId } }
  });
  if (!participant) return res.status(403).json({ error: 'Not in this conversation' });

  // 2. Save message to database
  const message = await db.message.create({
    data: { content, type, mediaUrl, replyToId, senderId, conversationId },
    include: { sender: { select: { id: true, name: true, avatar: true } } }
  });

  // 3. Publish to Redis so ALL server instances get the event
  await redisPublisher.publish('chat_events', JSON.stringify({
    type: 'NEW_MESSAGE',
    conversationId,
    message,
  }));

  res.status(201).json(message);
}

export async function getMessages(req: Request, res: Response) {
  const { conversationId } = req.params;
  const { cursor, limit = '30' } = req.query;

  const messages = await db.message.findMany({
    where: { conversationId, deletedAt: null },
    take: parseInt(limit as string),
    ...(cursor ? { skip: 1, cursor: { id: cursor as string } } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      statuses: true,
      replyTo: { include: { sender: { select: { name: true } } } }
    }
  });

  const reversed = messages.reverse();
  res.json({
    messages: reversed,
    nextCursor: messages.length === parseInt(limit as string) ? messages[0].id : null
  });
}