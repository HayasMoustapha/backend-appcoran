import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from './error.middleware.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new AppError('Unauthorized', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    return next(new AppError('Invalid token', 401));
  }
}
