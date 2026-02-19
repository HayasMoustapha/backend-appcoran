import { query } from '../../config/database.js';

// Create a new imam profile.
export async function createProfile({
  userId,
  name,
  biography,
  parcours,
  statut,
  arabic_name,
  title,
  education,
  experience,
  specialties,
  email,
  phone,
  photo_url
}) {
  const result = await query(
    `INSERT INTO imam_profile (user_id, name, biography, parcours, statut, arabic_name, title, education, experience, specialties, email, phone, photo_url, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
     RETURNING *`,
    [
      userId,
      name,
      biography,
      parcours,
      statut,
      arabic_name,
      title,
      education,
      experience,
      specialties,
      email,
      phone,
      photo_url
    ]
  );
  return result.rows[0];
}

// Get profile for a user.
export async function getProfileByUserId(userId) {
  const result = await query('SELECT * FROM imam_profile WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

// Update profile fields.
export async function updateProfile(userId, payload) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(payload)) {
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  values.push(userId);

  const result = await query(
    `UPDATE imam_profile SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${index} RETURNING *`,
    values
  );
  return result.rows[0];
}

// Delete profile.
export async function deleteProfile(userId) {
  await query('DELETE FROM imam_profile WHERE user_id = $1', [userId]);
}

// Public profile projection (no sensitive fields).
export async function getPublicProfile() {
  const result = await query(
    'SELECT name, biography, parcours, statut, arabic_name, title, education, experience, specialties, email, phone, photo_url, created_at, updated_at FROM imam_profile LIMIT 1'
  );
  return result.rows[0] || null;
}
