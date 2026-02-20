import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import env from '../../config/env.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validation.middleware.js';
import * as profileController from './profile.controller.js';

// Ensure profile upload directory exists.
await fs.mkdir(env.profileUploadDir, { recursive: true });

// Multer storage for profile photos.
const storage = multer.diskStorage({
  destination: env.profileUploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

const listFromString = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      // Ignore JSON parse errors
    }
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string().min(1)).optional());

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

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  biography: z.string().optional(),
  parcours: z.string().optional(),
  statut: z.string().optional(),
  arabic_name: z.string().optional(),
  title: z.string().optional(),
  education: listFromString,
  experience: listFromString,
  specialties: listFromString,
  i18n: jsonFromString,
  email: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional()
});

// Create/update supports optional photo upload.
router.post('/', requireAuth, upload.single('photo'), (req, res, next) => {
  if (req.file) {
    req.body.photo_url = req.file.path;
  }
  return validate(profileSchema)(req, res, next);
}, profileController.createProfile);

router.get('/', requireAuth, profileController.getProfile);

router.put('/', requireAuth, upload.single('photo'), (req, res, next) => {
  if (req.file) {
    req.body.photo_url = req.file.path;
  }
  return validate(profileSchema)(req, res, next);
}, profileController.updateProfile);

router.delete('/', requireAuth, profileController.deleteProfile);

// Public profile (no auth).
router.get('/public', profileController.getPublicProfile);

export default router;
