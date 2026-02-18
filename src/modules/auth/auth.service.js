import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { createUser, findUserByEmail } from './auth.repository.js';

/**
 * Register a new admin user.
 * - Ensures email uniqueness
 * - Hashes password using bcrypt
 */
export async function register({ email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    id: uuidv4(),
    email,
    passwordHash,
    role: 'admin'
  });

  return user;
}

/**
 * Authenticate admin user and return JWT (and optional refresh token).
 */
export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Compare provided password with stored hash.
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Short-lived access token.
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

  // Optional refresh token (if configured).
  const refreshToken = env.refreshTokenSecret
    ? jwt.sign({ id: user.id }, env.refreshTokenSecret, { expiresIn: '7d' })
    : null;

  return { token, refreshToken };
}
