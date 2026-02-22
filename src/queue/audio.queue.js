import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';

let queue;

function getConnection() {
  if (!env.redisUrl) {
    throw new Error('REDIS_URL is required for audio queue');
  }
  return new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

export function getAudioQueue() {
  if (!queue) {
    const connection = getConnection();
    queue = new Queue('audio-processing', {
      connection,
      prefix: env.audioQueuePrefix
    });
  }
  return queue;
}

export function getAudioDlqQueue() {
  const connection = getConnection();
  return new Queue('audio-processing-dlq', {
    connection,
    prefix: env.audioQueuePrefix
  });
}

export async function enqueueAudioJob(data) {
  if (!env.audioQueueEnabled) {
    throw new Error('Audio queue disabled');
  }
  const audioQueue = getAudioQueue();
  return audioQueue.add('processUpload', data, {
    attempts: env.audioQueueAttempts,
    backoff: { type: 'exponential', delay: env.audioQueueBackoffMs },
    timeout: env.audioQueueJobTimeoutMs,
    removeOnComplete: true,
    removeOnFail: env.audioQueueRemoveOnFail
  });
}
