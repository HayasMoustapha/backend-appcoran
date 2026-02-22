import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import env from './config/env.js';
import logger from './config/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { detectLanguage } from './middlewares/language.middleware.js';
import { ensureFfmpegAvailable, ensureFfprobeAvailable } from './utils/ffmpeg.util.js';
import authRoutes from './modules/auth/auth.routes.js';
import audioRoutes from './modules/audio/audio.routes.js';
import audioPublicRoutes from './modules/audio/audio.public.routes.js';
import profilePublicRoutes from './modules/profile/profile.public.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.js';
import { getSurahReference } from './utils/surahReference.js';

// Express application setup with security, rate limiting, and API routing.
const app = express();

// Trust reverse proxy headers (needed for rate-limiting + client IPs).
app.set('trust proxy', env.trustProxy);

// Security headers (allow cross-origin media streaming).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);
// CORS policy (configurable via env).
app.use(cors({ origin: env.corsOrigin }));
// JSON payloads for API requests.
app.use(express.json({ limit: '2mb' }));
// Language detection for i18n responses.
app.use(detectLanguage);
// Basic API rate limiting to mitigate abuse.
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax
  })
);
// Structured request logging.
app.use(pinoHttp({ logger }));

// Backward-compat: normalize duplicated /api/api prefix from stale frontends.
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api/, '/api');
  }
  next();
});

// Lightweight health endpoint for monitoring.
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Client-side error logs (frontend -> backend).
app.post('/api/logs/client-error', (req, res) => {
  const payload = req.body || {};
  logger.error(
    {
      source: 'ui',
      message: payload.message,
      stack: payload.stack,
      url: payload.url,
      userAgent: payload.userAgent
    },
    `🚨 UI error: ${payload.message || 'Unknown'}`
  );
  res.status(204).end();
});

// Health check for ffmpeg/ffprobe availability.
app.get('/health/ffmpeg', async (req, res) => {
  try {
    await ensureFfmpegAvailable(env.ffmpegPath);
    await ensureFfprobeAvailable(env.ffprobePath);
    return res.json({
      status: 'ok',
      ffmpeg: 'available',
      ffprobe: 'available'
    });
  } catch (err) {
    return res.status(503).json({
      status: 'degraded',
      ffmpeg: err?.path === 'ffmpeg' ? 'missing' : 'unknown',
      ffprobe: err?.path === 'ffprobe' ? 'missing' : 'unknown',
      error: 'Media tools not available (ffmpeg/ffprobe)'
    });
  }
});
app.get('/api/health/ffmpeg', async (req, res) => {
  try {
    await ensureFfmpegAvailable(env.ffmpegPath);
    await ensureFfprobeAvailable(env.ffprobePath);
    return res.json({
      status: 'ok',
      ffmpeg: 'available',
      ffprobe: 'available'
    });
  } catch (err) {
    return res.status(503).json({
      status: 'degraded',
      ffmpeg: err?.path === 'ffmpeg' ? 'missing' : 'unknown',
      ffprobe: err?.path === 'ffprobe' ? 'missing' : 'unknown',
      error: 'Media tools not available (ffmpeg/ffprobe)'
    });
  }
});
// Swagger UI for API documentation.
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Auth and audio routes.
app.use('/api/auth', authRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/api/surah-reference', (req, res) => {
  const lang = req.lang || 'fr';
  const data = getSurahReference().map((surah) => ({
    ...surah,
    name_local:
      lang === 'ar' ? surah.name_ar : lang === 'en' ? surah.name_phonetic : surah.name_fr
  }));
  res.json(data);
});
// Public routes.
app.use('/public', audioPublicRoutes);
app.use('/public', profilePublicRoutes);

// 404 fallback for unknown routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handling (must be last).
app.use(errorMiddleware);

export default app;
