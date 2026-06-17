import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middleware/auth.middleware';
import { Readable } from 'stream';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'chat-app', resource_type: 'auto' },
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ url: result!.secure_url, publicId: result!.public_id });
    }
  );

  Readable.from(req.file.buffer).pipe(stream);
});

export default router;
