import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
