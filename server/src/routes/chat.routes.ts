import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../services/db';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conversations = await db.conversation.findMany({
      where: { participants: { some: { userId: req.user!.id } } },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

export default router;
