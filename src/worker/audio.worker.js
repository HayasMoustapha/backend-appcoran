import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { processAudioUploadJob } from '../modules/audio/audio.processor.js';
import { updateAudio } from '../modules/audio/audio.repository.js';

function getConnection() {
  if (!env.redisUrl) {
    throw new Error('REDIS_URL is required for audio worker');
  }
  return new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

export function startAudioWorker() {
  const connection = getConnection();
  const worker = new Worker(
    'audio-processing',
    async (job) => {
      const { audioId } = job.data || {};
      if (audioId) {
        await updateAudio(audioId, {
          processing_status: 'processing',
          processing_started_at: new Date()
        });
      }
      return processAudioUploadJob(job.data);
    },
    {
      connection,
      prefix: env.audioQueuePrefix,
      concurrency: env.audioQueueConcurrency
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, audioId: job.data?.audioId }, 'Audio job completed');
  });

  worker.on('failed', async (job, err) => {
    const audioId = job?.data?.audioId;
    logger.error({ err, jobId: job?.id, audioId }, 'Audio job failed');
    if (audioId) {
      await updateAudio(audioId, {
        processing_status: 'failed',
        processing_error: err?.message || 'Audio processing failed',
        processing_completed_at: new Date()
      });
    }
  });

  return worker;
}
