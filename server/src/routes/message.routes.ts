import express from 'express';
import { getMessages, sendMessage } from '../controllers/message.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/:conversationId', requireAuth, getMessages);
router.post('/', requireAuth, sendMessage);

export default router;
