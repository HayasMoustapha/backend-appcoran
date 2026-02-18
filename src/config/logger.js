import pino from 'pino';

// Centralized logger (structured JSON logs).
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

export default logger;
