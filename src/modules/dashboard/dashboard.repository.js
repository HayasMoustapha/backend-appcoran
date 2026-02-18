import { query } from '../../config/database.js';

// Aggregate overview metrics.
export async function getOverview() {
  const totalRecitations = await query('SELECT COUNT(*)::int AS count FROM audios');
  const totalListens = await query('SELECT COALESCE(SUM(listen_count),0)::int AS count FROM audios');
  const totalDownloads = await query('SELECT COALESCE(SUM(download_count),0)::int AS count FROM audios');
  const totalShares = await query('SELECT COALESCE(SUM(share_count),0)::int AS count FROM audios');
  const avgListens = await query(
    'SELECT COALESCE(AVG(listen_count),0)::float AS value FROM audios'
  );
  const mostPopular = await query(
    'SELECT * FROM audios ORDER BY (listen_count + download_count) DESC NULLS LAST LIMIT 1'
  );
  const mostListenedSurah = await query(
    'SELECT numero_sourate, sourate, SUM(listen_count) AS listens FROM audios GROUP BY numero_sourate, sourate ORDER BY listens DESC NULLS LAST LIMIT 1'
  );

  return {
    totalRecitations: totalRecitations.rows[0].count,
    totalListens: totalListens.rows[0].count,
    totalDownloads: totalDownloads.rows[0].count,
    totalShares: totalShares.rows[0].count,
    averageListensPerRecitation: avgListens.rows[0].value,
    mostPopularAudio: mostPopular.rows[0] || null,
    mostListenedSurah: mostListenedSurah.rows[0] || null
  };
}

// Performance per recitation.
export async function getPerformance() {
  const result = await query(
    `SELECT id, title, listen_count, download_count,
      CASE WHEN listen_count = 0 THEN 0 ELSE (download_count::float / listen_count) END AS engagement_ratio
     FROM audios
     ORDER BY engagement_ratio DESC NULLS LAST`
  );
  return result.rows;
}

// Period-based stats for last N days with chart-ready aggregates.
export async function getPeriodStats(days) {
  const result = await query(
    `SELECT date_trunc('day', created_at)::date AS day,
            COUNT(*)::int AS recitations,
            COALESCE(SUM(listen_count),0)::int AS listens,
            COALESCE(SUM(download_count),0)::int AS downloads,
            COALESCE(SUM(share_count),0)::int AS shares
     FROM audios
     WHERE created_at >= NOW() - ($1 || ' days')::interval
     GROUP BY day
     ORDER BY day ASC`,
    [days]
  );
  return result.rows;
}
