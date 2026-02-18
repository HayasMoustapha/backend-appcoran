import { Router } from 'express';
import * as profileController from './profile.controller.js';

const router = Router();

// Public profile for frontend consumption.
router.get('/profile', profileController.getPublicProfile);

export default router;
