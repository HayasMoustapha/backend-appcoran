import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validation.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

const periodSchema = z.object({
  period: z.enum(['7d', '30d', '1y'])
});

// Admin-only dashboard endpoints.
router.get('/overview', requireAuth, dashboardController.overview);
router.get('/performance', requireAuth, dashboardController.performance);
router.get('/stats', requireAuth, validate(periodSchema, 'query'), dashboardController.stats);

export default router;
