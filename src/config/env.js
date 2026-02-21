import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env unless explicitly disabled (useful in tests).
if (process.env.DISABLE_DOTENV !== 'true') {
  dotenv.config();
}

// Required env vars for non-test execution.
const required = ['JWT_SECRET'];

if (process.env.NODE_ENV !== 'test') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

// Centralized environment configuration with sane defaults.
const appRoot = path.resolve(new URL('../..', import.meta.url).pathname);
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'appcoran';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
const corsOriginRaw = process.env.CORS_ORIGIN || '*';
const corsOrigin =
  corsOriginRaw === '*'
    ? '*'
    : corsOriginRaw.split(',').map((origin) => origin.trim()).filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 4000),
  databaseUrl,
  dbHost,
  dbPort: Number(dbPort),
  dbName,
  dbUser,
  dbPassword,
  dbAdminDatabase: process.env.DB_ADMIN_DATABASE || 'postgres',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || null,
  corsOrigin,
  uploadDir: path.resolve(appRoot, process.env.UPLOAD_DIR || './uploads'),
  profileUploadDir: path.resolve(appRoot, process.env.PROFILE_UPLOAD_DIR || './uploads/profiles'),
  basmalaPath: path.resolve(appRoot, process.env.BASMALA_PATH || './assets/default/basmala_default.mp3'),
  ffmpegRequired: process.env.FFMPEG_REQUIRED !== 'false',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 50),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  autoMigrate: process.env.AUTO_MIGRATE !== 'false',
  autoSeed: process.env.AUTO_SEED !== 'false',
  adminEmail: process.env.ADMIN_EMAIL || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || null,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || null,
  allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION === 'true',
  redisUrl: process.env.REDIS_URL || null,
  audioQueueEnabled: process.env.AUDIO_QUEUE_ENABLED === 'true',
  audioQueueConcurrency: Number(process.env.AUDIO_QUEUE_CONCURRENCY || 1),
  audioQueuePrefix: process.env.AUDIO_QUEUE_PREFIX || 'appcoran',
  keepOriginalAudio: process.env.KEEP_ORIGINAL_AUDIO !== 'false'
};

export default env;
