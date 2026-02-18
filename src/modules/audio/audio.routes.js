import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import env from '../../config/env.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as audioController from './audio.controller.js';

// Ensure upload directory exists before configuring Multer.
await fs.mkdir(env.uploadDir, { recursive: true });

// Disk storage config for uploaded audio files.
const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.mp3');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

// Multer instance with file size limits.
const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 }
});

const router = Router();

// Validation for create and update payloads.
const createSchema = z.object({
  title: z.string().min(1),
  sourate: z.string().min(1),
  numeroSourate: z.coerce.number().int().min(1).max(114),
  versetStart: z.coerce.number().int().optional(),
  versetEnd: z.coerce.number().int().optional(),
  description: z.string().optional(),
  addBasmala: z.coerce.boolean().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  sourate: z.string().min(1).optional(),
  numeroSourate: z.coerce.number().int().min(1).max(114).optional(),
  versetStart: z.number().int().optional(),
  versetEnd: z.number().int().optional(),
  description: z.string().optional()
});

const searchSchema = z.object({
  query: z.string().optional(),
  sourate: z.string().optional(),
  numero: z.coerce.number().int().min(1).max(114).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});

// Routes.
router.post('/', requireAuth, upload.single('file'), validate(createSchema), audioController.createAudio);
router.get('/search', validate(searchSchema, 'query'), audioController.searchAudios);
router.get('/popular', audioController.popularAudios);
router.get('/top-listened', audioController.topListened);
router.get('/top-downloaded', audioController.topDownloaded);
router.get('/recent', audioController.recentAudios);
router.get('/', audioController.listAudios);
router.get('/:id', audioController.getAudio);
router.put('/:id', requireAuth, validate(updateSchema), audioController.updateAudio);
router.delete('/:id', requireAuth, audioController.deleteAudio);
router.get('/:id/stream', audioController.streamAudio);
router.get('/:id/download', audioController.downloadAudio);

export default router;
