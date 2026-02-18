import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validation.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();

// Shared auth payload validation.
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Routes.
router.post('/register', validate(authSchema), authController.register);
router.post('/login', validate(authSchema), authController.login);

export default router;
