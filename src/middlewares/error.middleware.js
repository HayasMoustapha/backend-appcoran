import logger from '../config/logger.js';

// Custom error class with HTTP status support.
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Central error handler for consistent API responses.
export function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log only server errors to avoid noise for client errors.
  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    error: message,
    details: err.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
