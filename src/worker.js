import env from './config/env.js';
import logger from './config/logger.js';
import { startAudioWorker } from './worker/audio.worker.js';

async function start() {
  if (!env.audioQueueEnabled) {
    logger.warn('Audio queue is disabled; worker will not start.');
    return;
  }
  startAudioWorker();
  logger.info('Audio worker started');
}

start().catch((err) => {
  logger.error({ err }, 'Audio worker failed to start');
  process.exit(1);
});
