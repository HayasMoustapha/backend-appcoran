import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validation.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as authController from './auth.controller.js';
import env from '../../config/env.js';

const router = Router();

// Shared auth payload validation.
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Rate limit for auth routes.
const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax
});

const registerGuards = env.allowPublicRegistration
  ? [authLimiter]
  : [requireAuth, requireRole(['super-admin']), authLimiter];

router.post('/register', ...registerGuards, validate(authSchema), authController.register);
router.post('/login', authLimiter, validate(authSchema), authController.login);

export default router;
