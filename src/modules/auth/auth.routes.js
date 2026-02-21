import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validation.middleware.js';
import * as authController from './auth.controller.js';
import env from '../../config/env.js';

const router = Router();

// Shared auth payload validation.
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Routes.
const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax
});

router.post('/register', authLimiter, validate(authSchema), authController.register);
router.post('/login', authLimiter, validate(authSchema), authController.login);

export default router;
