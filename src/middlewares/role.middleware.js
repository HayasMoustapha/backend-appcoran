import { AppError } from './error.middleware.js';

// Role guard: ensures the user has one of the allowed roles.
export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    return next();
  };
}

// Convenience guard for admin-only endpoints.
export function requireAdmin(req, res, next) {
  return requireRole(['admin', 'super-admin'])(req, res, next);
}
