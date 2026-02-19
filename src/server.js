import fs from 'fs/promises';
import env from './config/env.js';
import logger from './config/logger.js';
import app from './app.js';
import { ensureFfmpegAvailable, ensureFfprobeAvailable } from './utils/ffmpeg.util.js';
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
  const rows = [
    ['🌍 Environment', String(env.nodeEnv)],
    ['📡 Port', String(env.port)],
    ['🗄️ Database', `${env.dbHost}:${env.dbPort}/${env.dbName}`],
    ['📁 Uploads', String(env.uploadDir)],
    ['🎧 Basmala', String(env.basmalaPath)],
    ['🧱 Auto migrate', String(env.autoMigrate)],
    ['🌱 Auto seed', String(env.autoSeed)],
    ['🎛️ FFmpeg required', String(env.ffmpegRequired)]
  ];
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  const valueWidth = Math.max(...rows.map(([, value]) => value.length));
  const line = `┌${'─'.repeat(labelWidth + 2)}┬${'─'.repeat(valueWidth + 2)}┐`;
  const mid = `├${'─'.repeat(labelWidth + 2)}┼${'─'.repeat(valueWidth + 2)}┤`;
  const bottom = `└${'─'.repeat(labelWidth + 2)}┴${'─'.repeat(valueWidth + 2)}┘`;

  logger.info('🚀 AppCoran Backend - Startup');
  logger.info(line);
  rows.forEach(([label, value], idx) => {
    const paddedLabel = label.padEnd(labelWidth, ' ');
    const paddedValue = value.padEnd(valueWidth, ' ');
    logger.info(`│ ${paddedLabel} │ ${paddedValue} │`);
    if (idx < rows.length - 1) logger.info(mid);
  });
  logger.info(bottom);

  await fs.mkdir(env.uploadDir, { recursive: true });
  if (env.ffmpegRequired) {
    await ensureFfmpegAvailable(env.ffmpegPath);
    await ensureFfprobeAvailable(env.ffprobePath);
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
