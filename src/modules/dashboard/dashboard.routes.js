import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validation.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

const periodSchema = z.object({
  period: z.enum(['7d', '30d', '1y'])
});

// Admin-only dashboard endpoints.
router.get('/overview', requireAuth, requireRole(['admin', 'super-admin']), dashboardController.overview);
router.get('/performance', requireAuth, requireRole(['admin', 'super-admin']), dashboardController.performance);
router.get(
  '/stats',
  requireAuth,
  requireRole(['admin', 'super-admin']),
  validate(periodSchema, 'query'),
  dashboardController.stats
);

export default router;
