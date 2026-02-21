import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import env from '../../config/env.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
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

const allowedMime = [
  /^audio\//,
  /^video\//,
  /^application\/octet-stream$/
];

const allowedExtensions = new Set([
  '.mp3',
  '.mpeg',
  '.ogg',
  '.wav',
  '.m4a',
  '.mp4',
  '.aac',
  '.flac',
  '.webm',
  '.weba'
]);

// Multer instance with file size limits + mime filter.
const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || '';
    const ok = allowedMime.some((rule) => rule.test(mimetype));
    if (!ok) {
      return cb(new AppError('Unsupported media type', 415));
    }
    if (mimetype === 'application/octet-stream') {
      const ext = path.extname(file.originalname || '').toLowerCase();
      if (!allowedExtensions.has(ext)) {
        return cb(new AppError('Unsupported media type', 415));
      }
    }
    return cb(null, true);
  }
});

const router = Router();

// Normalize boolean values coming from multipart/form-data or query strings.
const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
}, z.boolean());

const jsonFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return undefined;
    }
  }
  return value;
}, z.record(z.any()).optional());

// Validation for create and update payloads.
const createSchema = z.object({
  title: z.string().min(1),
  sourate: z.string().min(1),
  numeroSourate: z.coerce.number().int().min(1).max(114),
  versetStart: z.coerce.number().int().optional(),
  versetEnd: z.coerce.number().int().optional(),
  description: z.string().optional(),
  i18n: jsonFromString,
  addBasmala: booleanFromString.optional(),
  isComplete: booleanFromString.optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  sourate: z.string().min(1).optional(),
  numeroSourate: z.coerce.number().int().min(1).max(114).optional(),
  versetStart: z.number().int().optional(),
  versetEnd: z.number().int().optional(),
  description: z.string().optional(),
  i18n: jsonFromString,
  isComplete: booleanFromString.optional()
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

const favoriteParams = z.object({
  id: z.string().uuid()
});

// Routes.
router.post(
  '/',
  requireAuth,
  requireRole(['admin', 'super-admin']),
  upload.single('file'),
  validate(createSchema),
  audioController.createAudio
);
router.get('/favorites', requireAuth, audioController.listFavorites);
router.get('/search', validate(searchSchema, 'query'), audioController.searchAudios);
router.get('/popular', audioController.popularAudios);
router.get('/top-listened', audioController.topListened);
router.get('/top-downloaded', audioController.topDownloaded);
router.get('/recent', audioController.recentAudios);
router.get('/', audioController.listAudios);
router.get('/:id', audioController.getAudio);
router.post('/:id/favorite', requireAuth, validate(favoriteParams, 'params'), audioController.toggleFavorite);
router.put('/:id', requireAuth, requireRole(['admin', 'super-admin']), validate(updateSchema), audioController.updateAudio);
router.delete('/:id', requireAuth, requireRole(['admin', 'super-admin']), audioController.deleteAudio);
router.get('/:id/stream', audioController.streamAudio);
router.get('/:id/download', audioController.downloadAudio);

export default router;
