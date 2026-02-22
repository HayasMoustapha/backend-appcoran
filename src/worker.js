import http from 'http';
import env from './config/env.js';
import logger from './config/logger.js';
import { startAudioWorker } from './worker/audio.worker.js';
import { getAudioQueue } from './queue/audio.queue.js';

async function startHealthServer() {
  if (!env.workerPort) return;
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    try {
      const queue = getAudioQueue();
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', queue: counts }));
    } catch (err) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err?.message || 'queue unavailable' }));
    }
  });
  server.listen(env.workerPort, () => {
    logger.info({ port: env.workerPort }, 'Worker health server listening');
  });
}

async function start() {
  if (!env.audioQueueEnabled) {
    logger.warn('Audio queue is disabled; worker will not start.');
    return;
  }
  startAudioWorker();
  await startHealthServer();
  logger.info('Audio worker started');
}

start().catch((err) => {
  logger.error({ err }, 'Audio worker failed to start');
  process.exit(1);
});
