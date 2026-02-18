import { Router } from 'express';
import * as audioController from './audio.controller.js';

const router = Router();

// Public route: fetch by slug (no internal ID in URL).
router.get('/audios/:slug', audioController.getPublicAudio);
router.get('/audios/:slug/stream', audioController.streamPublicAudio);
router.get('/audios/:slug/download', audioController.downloadPublicAudio);
router.post('/audios/:slug/share', audioController.sharePublicAudio);

export default router;
