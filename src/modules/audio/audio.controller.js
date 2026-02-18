import { ok } from '../../utils/response.util.js';
import { AppError } from '../../middlewares/error.middleware.js';
import * as audioService from './audio.service.js';

// Create audio endpoint (upload + metadata).
export async function createAudio(req, res, next) {
  try {
    if (!req.file) {
      return next(new AppError('File is required', 400));
    }
    const payload = {
      title: req.body.title,
      sourate: req.body.sourate,
      numeroSourate: req.body.numeroSourate,
      versetStart: req.body.versetStart ?? null,
      versetEnd: req.body.versetEnd ?? null,
      description: req.body.description,
      filePath: req.file.path,
      addBasmala: req.body.addBasmala === true
    };
    const audio = await audioService.createAudioEntry(payload);
    return ok(res, audio, 201);
  } catch (err) {
    return next(err);
  }
}

// List audios (optional query filters).
export async function listAudios(req, res, next) {
  try {
    const audios = await audioService.listAllAudios({ sourate: req.query.sourate });
    return ok(res, audios, 200);
  } catch (err) {
    return next(err);
  }
}

// Get audio by id.
export async function getAudio(req, res, next) {
  try {
    const audio = await audioService.getAudioWithViewIncrement(req.params.id);
    return ok(res, audio, 200);
  } catch (err) {
    return next(err);
  }
}

// Update audio metadata.
export async function updateAudio(req, res, next) {
  try {
    const audio = await audioService.updateAudioMetadata(req.params.id, req.body);
    return ok(res, audio, 200);
  } catch (err) {
    return next(err);
  }
}

// Delete audio.
export async function deleteAudio(req, res, next) {
  try {
    await audioService.removeAudio(req.params.id);
    return ok(res, { status: 'deleted' }, 200);
  } catch (err) {
    return next(err);
  }
}

// Stream audio content.
export async function streamAudio(req, res, next) {
  try {
    await audioService.streamAudio(res, req.params.id, req.headers.range);
  } catch (err) {
    return next(err);
  }
}

// Download audio file.
export async function downloadAudio(req, res, next) {
  try {
    return await audioService.downloadAudio(res, req.params.id);
  } catch (err) {
    return next(err);
  }
}

// Advanced search with filters and pagination.
export async function searchAudios(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await audioService.searchAudio({
      queryText: req.query.query,
      sourate: req.query.sourate,
      numero: req.query.numero ? Number(req.query.numero) : undefined,
      from: req.query.from,
      to: req.query.to,
      page,
      limit,
      sortBy: req.query.sortBy,
      sortDir: req.query.sortDir
    });
    return ok(res, { page, limit, total: result.total, data: result.data }, 200);
  } catch (err) {
    return next(err);
  }
}

// Ranking endpoints.
export async function popularAudios(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getPopular(limit);
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

export async function topListened(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getTopListened(limit);
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

export async function topDownloaded(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getTopDownloaded(limit);
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

export async function recentAudios(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getRecent(limit);
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

// Public audio by slug (no internal ID in URL).
export async function getPublicAudio(req, res, next) {
  try {
    const audio = await audioService.getPublicAudioWithViewIncrement(req.params.slug);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const safe = {
      title: audio.title,
      sourate: audio.sourate,
      numero_sourate: audio.numero_sourate,
      verset_start: audio.verset_start,
      verset_end: audio.verset_end,
      description: audio.description,
      slug: audio.slug,
      view_count: audio.view_count,
      listen_count: audio.listen_count,
      download_count: audio.download_count,
      created_at: audio.created_at,
      share_url: `${baseUrl}/public/audios/${audio.slug}`,
      stream_url: `${baseUrl}/public/audios/${audio.slug}/stream`,
      download_url: `${baseUrl}/public/audios/${audio.slug}/download`
    };
    return ok(res, safe, 200);
  } catch (err) {
    return next(err);
  }
}

// Public stream by slug.
export async function streamPublicAudio(req, res, next) {
  try {
    await audioService.streamPublicAudio(res, req.params.slug, req.headers.range);
  } catch (err) {
    return next(err);
  }
}

// Public download by slug.
export async function downloadPublicAudio(req, res, next) {
  try {
    return await audioService.downloadPublicAudio(res, req.params.slug);
  } catch (err) {
    return next(err);
  }
}

// Public share endpoint increments share_count.
export async function sharePublicAudio(req, res, next) {
  try {
    const audio = await audioService.sharePublicAudio(req.params.slug);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return ok(res, {
      slug: audio.slug,
      share_url: `${baseUrl}/public/audios/${audio.slug}`
    }, 200);
  } catch (err) {
    return next(err);
  }
}
