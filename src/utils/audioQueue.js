import { Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';
import logger from '../config/logger.js';

let queue;
let queueEvents;
let worker;
let initialized = false;
const handlers = new Map();

export function registerAudioJob(name, handler) {
  handlers.set(name, handler);
}

function init() {
  if (initialized || !env.audioQueueEnabled || !env.redisUrl) return;

  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
  queue = new Queue('audio-processing', {
    connection,
    prefix: env.audioQueuePrefix
  });
  queueEvents = new QueueEvents('audio-processing', {
    connection,
    prefix: env.audioQueuePrefix
  });
  worker = new Worker(
    'audio-processing',
    async (job) => {
      const handler = handlers.get(job.name);
      if (!handler) {
        throw new Error(`No handler for job: ${job.name}`);
      }
      return handler(job.data);
    },
    {
      connection,
      prefix: env.audioQueuePrefix,
      concurrency: env.audioQueueConcurrency
    }
  );
  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, name: job?.name }, 'Audio queue job failed');
  });
  initialized = true;
}

export async function runAudioJob(name, data, fallback) {
  if (!env.audioQueueEnabled || !env.redisUrl) {
    return fallback();
  }
  init();
  const job = await queue.add(name, data, {
    removeOnComplete: true,
    removeOnFail: true
  });
  return job.waitUntilFinished(queueEvents);
}

export async function enqueueAudioJob(name, data) {
  if (!env.audioQueueEnabled || !env.redisUrl) {
    return false;
  }
  init();
  await queue.add(name, data, {
    removeOnComplete: true,
    removeOnFail: true
  });
  return true;
}
