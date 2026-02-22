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
  i18n,
  filePath,
  streamPath,
  basmalaAdded,
  slug,
  isComplete,
  processingStatus,
  processingError,
  durationSeconds,
  bitrateKbps,
  sizeBytes
}) {
  const result = await query(
    `INSERT INTO audios
      (id, title, sourate, numero_sourate, verset_start, verset_end, description, i18n, file_path, stream_path, basmala_added, slug, is_complete, processing_status, processing_error, duration_seconds, bitrate_kbps, size_bytes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
     RETURNING *`,
    [
      id,
      title,
      sourate,
      numeroSourate,
      versetStart,
      versetEnd,
      description,
      i18n ?? {},
      filePath,
      streamPath,
      basmalaAdded,
      slug,
      Boolean(isComplete),
      processingStatus ?? 'uploaded',
      processingError ?? null,
      durationSeconds ?? null,
      bitrateKbps ?? null,
      sizeBytes ?? null
    ]
  );
  return result.rows[0];
}

// Check for duplicate audio identity (title + surah + verse range).
export async function findDuplicateAudio({
  title,
  sourate,
  versetStart,
  versetEnd,
  excludeId
}) {
  const result = await query(
    `SELECT id FROM audios
     WHERE LOWER(title) = LOWER($1)
       AND LOWER(sourate) = LOWER($2)
       AND COALESCE(verset_start, 0) = COALESCE($3, 0)
       AND COALESCE(verset_end, 0) = COALESCE($4, 0)
       AND ($5::uuid IS NULL OR id <> $5)
     LIMIT 1`,
    [title, sourate, versetStart ?? 0, versetEnd ?? 0, excludeId ?? null]
  );
  return result.rows[0] || null;
}

// Initialize stats row for a given audio.
export async function createAudioStats(audioId) {
  await query(
    'INSERT INTO audio_stats (id, audio_id, listens_count, downloads_count) VALUES (gen_random_uuid(), $1, 0, 0)',
    [audioId]
  );
}

// List audios (optionally filtered by sourate).
export async function listAudios({ sourate, includeProcessing = false }) {
  const readyClause =
    "(processing_status IS NULL OR processing_status IN ('ready','completed'))";
  const whereProcessing = includeProcessing ? '' : ` AND ${readyClause}`;
  if (sourate) {
    const result = await query(
      `SELECT * FROM audios WHERE sourate = $1${whereProcessing} ORDER BY numero_sourate ASC, verset_start ASC`,
      [sourate]
    );
    return result.rows;
  }
  const result = await query(
    `SELECT * FROM audios${includeProcessing ? '' : ` WHERE ${readyClause}`} ORDER BY numero_sourate ASC, verset_start ASC`
  );
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

// Favorite helpers.
export async function listFavoriteAudioIds(userId) {
  const result = await query(
    'SELECT audio_id FROM audio_favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map((row) => row.audio_id);
}

export async function toggleFavorite(userId, audioId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT 1 FROM audio_favorites WHERE user_id = $1 AND audio_id = $2',
      [userId, audioId]
    );

    if (existing.rowCount > 0) {
      await client.query(
        'DELETE FROM audio_favorites WHERE user_id = $1 AND audio_id = $2',
        [userId, audioId]
      );
      const updated = await client.query(
        'UPDATE audios SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count',
        [audioId]
      );
      await client.query('COMMIT');
      return { liked: false, like_count: updated.rows[0]?.like_count ?? 0 };
    }

    await client.query(
      'INSERT INTO audio_favorites (user_id, audio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, audioId]
    );
    const updated = await client.query(
      'UPDATE audios SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count',
      [audioId]
    );
    await client.query('COMMIT');
    return { liked: true, like_count: updated.rows[0]?.like_count ?? 0 };
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

  where.push("(processing_status IS NULL OR processing_status IN ('ready','completed'))");
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
    "SELECT * FROM audios WHERE (processing_status IS NULL OR processing_status IN ('ready','completed')) ORDER BY (listen_count + download_count) DESC NULLS LAST LIMIT $1",
    [limit]
  );
  return result.rows;
}

export async function listTopListened(limit) {
  const result = await query(
    "SELECT * FROM audios WHERE (processing_status IS NULL OR processing_status IN ('ready','completed')) ORDER BY listen_count DESC NULLS LAST LIMIT $1",
    [limit]
  );
  return result.rows;
}

export async function listTopDownloaded(limit) {
  const result = await query(
    "SELECT * FROM audios WHERE (processing_status IS NULL OR processing_status IN ('ready','completed')) ORDER BY download_count DESC NULLS LAST LIMIT $1",
    [limit]
  );
  return result.rows;
}

export async function listRecent(limit) {
  const result = await query(
    "SELECT * FROM audios WHERE (processing_status IS NULL OR processing_status IN ('ready','completed')) ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}
