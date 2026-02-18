import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import env from './config/env.js';
import logger from './config/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import audioRoutes from './modules/audio/audio.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax
  })
);
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/audios', audioRoutes);

app.use(errorMiddleware);

export default app;
