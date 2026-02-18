import fs from 'fs/promises';
import env from './config/env.js';
import logger from './config/logger.js';
import app from './app.js';
import { ensureFfmpegAvailable } from './utils/ffmpeg.util.js';
import { ensureDatabaseExists, runMigrations } from './config/migrations.js';
import { seedAdmin } from './config/seeds.js';

export async function start() {
  await fs.mkdir(env.uploadDir, { recursive: true });
  await ensureFfmpegAvailable();
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

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}
