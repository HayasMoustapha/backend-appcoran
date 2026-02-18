import { query } from '../../config/database.js';

// Fetch user by email (admin account).
export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

// Persist a new admin user.
export async function createUser({ id, email, passwordHash, role }) {
  const result = await query(
    'INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4, NOW()) RETURNING id, email, role, created_at',
    [id, email, passwordHash, role]
  );
  return result.rows[0];
}
