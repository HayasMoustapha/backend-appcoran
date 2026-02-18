import { query } from '../../config/database.js';

// Insert a new audio row.
export async function createAudio({
  id,
  title,
  sourate,
  versetStart,
  versetEnd,
  description,
  filePath,
  basmalaAdded
}) {
  const result = await query(
    `INSERT INTO audios
      (id, title, sourate, verset_start, verset_end, description, file_path, basmala_added, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     RETURNING *`,
    [id, title, sourate, versetStart, versetEnd, description, filePath, basmalaAdded]
  );
  return result.rows[0];
}

// Initialize stats row for a given audio.
export async function createAudioStats(audioId) {
  await query(
    'INSERT INTO audio_stats (id, audio_id, listens_count, downloads_count) VALUES (gen_random_uuid(), $1, 0, 0)',
    [audioId]
  );
}

// List audios (optionally filtered by sourate).
export async function listAudios({ sourate }) {
  if (sourate) {
    const result = await query('SELECT * FROM audios WHERE sourate = $1 ORDER BY created_at DESC', [sourate]);
    return result.rows;
  }
  const result = await query('SELECT * FROM audios ORDER BY created_at DESC');
  return result.rows;
}

// Get audio by ID.
export async function getAudioById(id) {
  const result = await query('SELECT * FROM audios WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Update audio fields (dynamic SQL from provided payload).
export async function updateAudio(id, payload) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(payload)) {
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  values.push(id);

  const result = await query(
    `UPDATE audios SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
    values
  );
  return result.rows[0];
}

// Delete audio by ID.
export async function deleteAudio(id) {
  await query('DELETE FROM audios WHERE id = $1', [id]);
}

// Increment listens counter.
export async function incrementListen(audioId) {
  await query('UPDATE audio_stats SET listens_count = listens_count + 1 WHERE audio_id = $1', [audioId]);
}

// Increment downloads counter.
export async function incrementDownload(audioId) {
  await query('UPDATE audio_stats SET downloads_count = downloads_count + 1 WHERE audio_id = $1', [audioId]);
}
