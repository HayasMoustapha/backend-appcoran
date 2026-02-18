import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import env from './env.js';
import { query } from './database.js';

/**
 * Seed admin account if ADMIN_EMAIL and ADMIN_PASSWORD are provided.
 */
export async function seedAdmin() {
  // Only seed when credentials are configured.
  if (!env.adminEmail || !env.adminPassword) return;

  // Avoid duplicate admin creation.
  const existing = await query('SELECT id FROM users WHERE email = $1', [
    env.adminEmail
  ]);

  if (existing.rows.length > 0) return;

  // Store hashed password.
  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await query(
    'INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,NOW())',
    [uuidv4(), env.adminEmail, passwordHash, 'admin']
  );
}
