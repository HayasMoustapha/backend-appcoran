import logger from '../config/logger.js';

// Custom error class with HTTP status support.
export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Map known error types to stable HTTP responses.
function resolveError(err) {
  // Explicit AppError override.
  if (err instanceof AppError) {
    return { status: err.statusCode, message: err.message, details: err.details };
  }

  // Zod validation errors.
  if (err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    return { status: 400, message: 'Validation error', details: err.issues || err.details };
  }

  // Multer upload errors.
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, message: 'Uploaded file is too large' };
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return { status: 400, message: 'Unexpected file field' };
  }

  // JSON body parse errors.
  if (err instanceof SyntaxError && 'body' in err) {
    return { status: 400, message: 'Invalid JSON payload' };
  }

  // Common PostgreSQL errors.
  if (err?.code === '23505') {
    return { status: 409, message: 'Resource already exists', details: err.detail };
  }
  if (err?.code === '23503') {
    return { status: 400, message: 'Invalid reference', details: err.detail };
  }
  if (err?.code === '22P02') {
    return { status: 400, message: 'Invalid input syntax', details: err.detail };
  }

  // Fallback.
  return { status: err.statusCode || 500, message: err.message || 'Internal server error' };
}

// Central error handler for consistent API responses.
export function errorMiddleware(err, req, res, next) {
  const resolved = resolveError(err);

  // Log only server errors to avoid noise for client errors.
  if (resolved.status >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(resolved.status).json({
    error: resolved.message,
    details: resolved.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
