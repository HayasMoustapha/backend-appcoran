import fs from 'fs/promises';
import env from './config/env.js';
import logger from './config/logger.js';
import app from './app.js';
import { ensureFfmpegAvailable } from './utils/ffmpeg.util.js';
import { ensureDatabaseExists, runMigrations } from './config/migrations.js';
import { seedAdmin } from './config/seeds.js';

/**
 * Boot sequence:
 * 1) Ensure uploads dir exists
 * 2) Ensure FFmpeg is available
 * 3) Create DB if missing + run migrations
 * 4) Seed admin (optional)
 * 5) Start HTTP server
 */
export async function start() {
  await fs.mkdir(env.uploadDir, { recursive: true });
  if (env.ffmpegRequired) {
    await ensureFfmpegAvailable(env.ffmpegPath);
  } else {
    logger.warn('FFmpeg check skipped (FFMPEG_REQUIRED=false)');
  }
  if (env.autoMigrate) {
    await ensureDatabaseExists();
    await runMigrations();
  }
  if (env.autoSeed) {
    await seedAdmin();
  }

  app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
  });
}

// Auto-start when not running in tests.
if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}
