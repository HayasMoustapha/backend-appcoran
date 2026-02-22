import { QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { processAudioUploadJob } from '../modules/audio/audio.processor.js';
import { updateAudio } from '../modules/audio/audio.repository.js';
import { getAudioDlqQueue } from '../queue/audio.queue.js';

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
      concurrency: env.audioQueueConcurrency,
      maxStalledCount: env.audioQueueMaxStalledCount,
      stalledInterval: env.audioQueueStalledIntervalMs
    }
  );

  const queueEvents = new QueueEvents('audio-processing', {
    connection,
    prefix: env.audioQueuePrefix
  });

  queueEvents.on('waiting', ({ jobId }) => {
    logger.info({ jobId }, 'Audio job waiting');
  });
  queueEvents.on('active', ({ jobId, prev }) => {
    logger.info({ jobId, prev }, 'Audio job active');
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, audioId: job.data?.audioId }, 'Audio job completed');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Audio job stalled');
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
    try {
      const dlq = getAudioDlqQueue();
      await dlq.add(
        'failedUpload',
        { audioId, originalJobId: job?.id, reason: err?.message || 'Audio processing failed' },
        { removeOnComplete: true, removeOnFail: true }
      );
    } catch (dlqErr) {
      logger.error({ err: dlqErr, jobId: job?.id, audioId }, 'Failed to enqueue DLQ job');
    }
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Audio job failed (queue events)');
  });
  queueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Audio job completed (queue events)');
  });

  return worker;
}
