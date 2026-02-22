import pino from 'pino';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const levelEmojis = {
  fatal: '💥',
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🐛',
  trace: '🔍'
};

let transport;
const prettyForced = process.env.LOG_PRETTY === 'true';
const prettyEnabled =
  prettyForced ||
  (process.env.LOG_PRETTY !== 'false' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test');

if (prettyEnabled) {
  try {
    require.resolve('pino-pretty');
    transport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        singleLine: false,
        ignore: 'pid,hostname',
        customPrettifiers: {
          level: (label) => `${levelEmojis[label] || ''} ${label.toUpperCase()}`
        }
      }
    });
  } catch (err) {
    transport = undefined;
  }
}

// Centralized logger with human-friendly output in dev.
const logger = pino(
  {
    level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
    base: null
  },
  transport
);

export default logger;
