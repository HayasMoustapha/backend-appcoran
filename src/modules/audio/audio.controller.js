import { ok } from '../../utils/response.util.js';
import { AppError } from '../../middlewares/error.middleware.js';
import * as audioService from './audio.service.js';
import { applyTranslations } from '../../utils/i18n.util.js';

const TRANSLATABLE_FIELDS = ['title', 'description', 'sourate'];

function parseJson(value) {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return undefined;
    }
  }
  return undefined;
}

function localize(audio, lang) {
  return applyTranslations(audio, lang, TRANSLATABLE_FIELDS);
}

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
      i18n: parseJson(req.body.i18n),
      filePath: req.file.path,
      addBasmala: req.body.addBasmala === true
    };
    const audio = await audioService.createAudioEntry(payload);
    return ok(res, localize(audio, req.lang), 201);
  } catch (err) {
    return next(err);
  }
}

// List audios (optional query filters).
export async function listAudios(req, res, next) {
  try {
    const audios = await audioService.listAllAudios({ sourate: req.query.sourate });
    return ok(res, audios.map((item) => localize(item, req.lang)), 200);
  } catch (err) {
    return next(err);
  }
}

// Get audio by id.
export async function getAudio(req, res, next) {
  try {
    const audio = await audioService.getAudioWithViewIncrement(req.params.id);
    return ok(res, localize(audio, req.lang), 200);
  } catch (err) {
    return next(err);
  }
}

// Update audio metadata.
export async function updateAudio(req, res, next) {
  try {
    const payload = {
      ...req.body,
      i18n: parseJson(req.body.i18n)
    };
    const audio = await audioService.updateAudioMetadata(req.params.id, payload);
    return ok(res, localize(audio, req.lang), 200);
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
    const queryText = req.query.query;
    const inferredNumero =
      req.query.numero !== undefined
        ? Number(req.query.numero)
        : typeof queryText === 'string' && queryText.trim().match(/^(\\d{1,3})$/)
        ? Number(queryText.trim())
        : undefined;
    const result = await audioService.searchAudio({
      queryText,
      sourate: req.query.sourate,
      numero: inferredNumero,
      from: req.query.from,
      to: req.query.to,
      page,
      limit,
      sortBy: req.query.sortBy,
      sortDir: req.query.sortDir
    });
    return ok(
      res,
      { page, limit, total: result.total, data: result.data.map((item) => localize(item, req.lang)) },
      200
    );
  } catch (err) {
    return next(err);
  }
}

// Ranking endpoints.
export async function popularAudios(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getPopular(limit);
    return ok(res, data.map((item) => localize(item, req.lang)), 200);
  } catch (err) {
    return next(err);
  }
}

export async function topListened(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getTopListened(limit);
    return ok(res, data.map((item) => localize(item, req.lang)), 200);
  } catch (err) {
    return next(err);
  }
}

export async function topDownloaded(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getTopDownloaded(limit);
    return ok(res, data.map((item) => localize(item, req.lang)), 200);
  } catch (err) {
    return next(err);
  }
}

export async function recentAudios(req, res, next) {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await audioService.getRecent(limit);
    return ok(res, data.map((item) => localize(item, req.lang)), 200);
  } catch (err) {
    return next(err);
  }
}

// Public audio by slug (no internal ID in URL).
export async function getPublicAudio(req, res, next) {
  try {
    const audio = localize(
      await audioService.getPublicAudioWithViewIncrement(req.params.slug),
      req.lang
    );
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
