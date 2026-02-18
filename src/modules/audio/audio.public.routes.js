import { Router } from 'express';
import * as audioController from './audio.controller.js';

const router = Router();

// Public route: fetch by slug (no internal ID in URL).
router.get('/audios/:slug', audioController.getPublicAudio);

export default router;
