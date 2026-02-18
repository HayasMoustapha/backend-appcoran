import dotenv from 'dotenv';

// Load environment variables from .env unless explicitly disabled (useful in tests).
if (process.env.DISABLE_DOTENV !== 'true') {
  dotenv.config();
}

// Required env vars for non-test execution.
const required = ['DATABASE_URL', 'JWT_SECRET'];

if (process.env.NODE_ENV !== 'test') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

// Centralized environment configuration with sane defaults.
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  dbAdminDatabase: process.env.DB_ADMIN_DATABASE || 'postgres',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || null,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  basmalaPath: process.env.BASMALA_PATH || './assets/basmala.mp3',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 50),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  autoMigrate: process.env.AUTO_MIGRATE !== 'false',
  autoSeed: process.env.AUTO_SEED !== 'false',
  adminEmail: process.env.ADMIN_EMAIL || null,
  adminPassword: process.env.ADMIN_PASSWORD || null,
  keepOriginalAudio: process.env.KEEP_ORIGINAL_AUDIO !== 'false'
};

export default env;
