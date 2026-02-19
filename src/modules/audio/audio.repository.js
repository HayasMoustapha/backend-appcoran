import { pool, query } from '../../config/database.js';

// Insert a new audio row.
export async function createAudio({
  id,
  title,
  sourate,
  numeroSourate,
  versetStart,
  versetEnd,
  description,
  filePath,
  streamPath,
  basmalaAdded,
  slug
}) {
  const result = await query(
    `INSERT INTO audios
      (id, title, sourate, numero_sourate, verset_start, verset_end, description, file_path, stream_path, basmala_added, slug, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
     RETURNING *`,
    [
      id,
      title,
      sourate,
      numeroSourate,
      versetStart,
      versetEnd,
      description,
      filePath,
      streamPath,
      basmalaAdded,
      slug
    ]
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
    const result = await query(
      'SELECT * FROM audios WHERE sourate = $1 ORDER BY numero_sourate ASC, verset_start ASC',
      [sourate]
    );
    return result.rows;
  }
  const result = await query('SELECT * FROM audios ORDER BY numero_sourate ASC, verset_start ASC');
  return result.rows;
}

// Get audio by ID.
export async function getAudioById(id) {
  const result = await query('SELECT * FROM audios WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Get audio by public slug.
export async function getAudioBySlug(slug) {
  const result = await query('SELECT * FROM audios WHERE slug = $1', [slug]);
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

// Increment view count (atomic update).
export async function incrementView(audioId) {
  await query('UPDATE audios SET view_count = view_count + 1 WHERE id = $1', [audioId]);
}

// Increment share count.
export async function incrementShare(audioId) {
  await query('UPDATE audios SET share_count = share_count + 1 WHERE id = $1', [audioId]);
}

// Increment listens counter.
export async function incrementListen(audioId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE audios SET listen_count = listen_count + 1 WHERE id = $1', [audioId]);
    await client.query('UPDATE audio_stats SET listens_count = listens_count + 1 WHERE audio_id = $1', [audioId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Increment downloads counter.
export async function incrementDownload(audioId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE audios SET download_count = download_count + 1 WHERE id = $1', [audioId]);
    await client.query('UPDATE audio_stats SET downloads_count = downloads_count + 1 WHERE audio_id = $1', [audioId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Search with filters + pagination + sorting.
export async function searchAudios({
  queryText,
  sourate,
  numero,
  from,
  to,
  page,
  limit,
  sortBy,
  sortDir
}) {
  const where = [];
  const values = [];
  let idx = 1;

  if (queryText) {
    where.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR sourate ILIKE $${idx})`);
    values.push(`%${queryText}%`);
    idx++;
  }
  if (sourate) {
    where.push(`sourate = $${idx}`);
    values.push(sourate);
    idx++;
  }
  if (numero) {
    where.push(`numero_sourate = $${idx}`);
    values.push(numero);
    idx++;
  }
  if (from) {
    where.push(`created_at >= $${idx}`);
    values.push(from);
    idx++;
  }
  if (to) {
    where.push(`created_at <= $${idx}`);
    values.push(to);
    idx++;
  }

  const allowedSort = new Set([
    'created_at',
    'listen_count',
    'download_count',
    'view_count',
    'numero_sourate',
    'verset_start',
    'title'
  ]);
  const orderBy = allowedSort.has(sortBy)
    ? `${sortBy} ${sortDir === 'desc' ? 'DESC' : 'ASC'}`
    : 'numero_sourate ASC, verset_start ASC';

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*)::int AS count FROM audios ${whereSql}`,
    values
  );

  const offset = (page - 1) * limit;
  values.push(limit, offset);

  const result = await query(
    `SELECT * FROM audios ${whereSql} ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );

  return { total: countRes.rows[0].count, data: result.rows };
}

// Ranking queries.
export async function listPopular(limit) {
  const result = await query(
    'SELECT * FROM audios ORDER BY (listen_count + download_count) DESC NULLS LAST LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function listTopListened(limit) {
  const result = await query(
    'SELECT * FROM audios ORDER BY listen_count DESC NULLS LAST LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function listTopDownloaded(limit) {
  const result = await query(
    'SELECT * FROM audios ORDER BY download_count DESC NULLS LAST LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function listRecent(limit) {
  const result = await query(
    'SELECT * FROM audios ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}
