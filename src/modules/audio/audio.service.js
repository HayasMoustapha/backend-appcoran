import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import logger from '../../config/logger.js';
import { ensureFfmpegAvailable, transcodeToMp3 } from '../../utils/ffmpeg.util.js';
import {
  getSurahByNumber,
  normalizeVerseRange,
  resolveSurahName,
  validateVerseRange
} from '../../utils/surahReference.js';
import { processUploadedFile, scheduleAudioProcessing } from './audio.processor.js';
import {
  createAudio,
  createAudioStats,
  deleteAudio,
  findDuplicateAudio,
  getAudioById,
  getAudioBySlug,
  incrementView,
  incrementShare,
  incrementDownload,
  incrementListen,
  listFavoriteAudioIds,
  listAudios,
  listPopular,
  listRecent,
  listTopDownloaded,
  listTopListened,
  searchAudios,
  toggleFavorite,
  updateAudio
} from './audio.repository.js';
import { getPublicProfile } from '../profile/profile.repository.js';

// Basic slug sanitizer: lowercases, removes non-alnum, collapses dashes.
function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Ensure slug uniqueness by appending incrementing suffix.
async function ensureUniqueSlug(baseSlug, ignoreId = null) {
  let slug = baseSlug;
  let counter = 2;
  while (true) {
    const existing = await getAudioBySlug(slug);
    if (!existing || (ignoreId && existing.id === ignoreId)) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

function resolveStoredPath(filePath) {
  if (!filePath) return filePath;
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(env.uploadDir, '..', filePath);
}

function toSafeFilename(value, fallback) {
  if (!value) return fallback;
  const safe = value
    .toString()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return safe || fallback;
}

async function buildDownloadFilename(audio, ext) {
  const profile = await getPublicProfile();
  const imamName = toSafeFilename(profile?.name, 'imam');
  const surahName = toSafeFilename(audio.sourate || audio.title, 'sourate');
  const surahNumber = audio.numeroSourate || '';
  return `${imamName}_${surahName}_${surahNumber}${ext || ''}`;
}

async function ensureStreamPathForAudio(audio) {
  const candidatePath = resolveStoredPath(audio.stream_path || audio.file_path);
  if (candidatePath && path.extname(candidatePath)) {
    const ext = path.extname(candidatePath).toLowerCase();
    if (['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.webm'].includes(ext)) {
      return candidatePath;
    }
  }
  if (!candidatePath) {
    return candidatePath;
  }

  try {
    await ensureFfmpegAvailable(env.ffmpegPath);
    logger.info(
      {
        audioId: audio.id,
        sourcePath: resolveStoredPath(audio.file_path)
      },
      'Starting MP3 conversion for streaming'
    );
    const mp3Path = path.join(env.uploadDir, `${uuidv4()}_stream.mp3`);
    await transcodeToMp3({
      inputPath: resolveStoredPath(audio.file_path),
      outputPath: mp3Path,
      ffmpegPath: env.ffmpegPath
    });
    await updateAudio(audio.id, { stream_path: mp3Path });
    logger.info(
      {
        audioId: audio.id,
        streamPath: mp3Path
      },
      'MP3 conversion completed for streaming'
    );
    return mp3Path;
  } catch (err) {
    logger.error({ err, audioId: audio.id }, 'MP3 conversion failed for streaming');
    return resolveStoredPath(audio.file_path);
  }
}

/**
 * Create a new audio entry, optionally prefixing basmala.
 * Handles basmala merging and optional cleanup of original file.
 */
export async function createAudioEntry({
  title,
  sourate,
  numeroSourate,
  versetStart,
  versetEnd,
  description,
  i18n,
  filePath,
  addBasmala,
  isComplete
}) {
  const surah = getSurahByNumber(numeroSourate);
  if (!surah) {
    throw new AppError('Invalid surah number', 400);
  }
  const canonicalName = resolveSurahName(numeroSourate, sourate);
  if (!canonicalName) {
    throw new AppError('Invalid surah name for selected number', 400);
  }
  const rangeStart = isComplete ? 1 : versetStart;
  const rangeEnd = isComplete ? surah.verses : versetEnd;
  const normalizedRange = normalizeVerseRange(rangeStart, rangeEnd);
  if (!validateVerseRange(numeroSourate, normalizedRange.start, normalizedRange.end)) {
    throw new AppError('Invalid verse range for selected surah', 400);
  }
  const duplicate = await findDuplicateAudio({
    title,
    sourate: canonicalName,
    versetStart: normalizedRange.start,
    versetEnd: normalizedRange.end
  });
  if (duplicate) {
    throw new AppError('Duplicate recitation (same title, surah, and verse range)', 409);
  }

  const baseSlug = `${numeroSourate}-${slugify(title)}`;
  const slug = await ensureUniqueSlug(baseSlug);

  const resolvedUploadPath = resolveStoredPath(filePath);
  const audioId = uuidv4();

  if (env.audioProcessingAsync) {
    const audio = await createAudio({
      id: audioId,
      title,
      sourate: canonicalName,
      numeroSourate,
      versetStart: normalizedRange.start,
      versetEnd: normalizedRange.end,
      description,
      i18n,
      filePath: resolvedUploadPath,
      streamPath: null,
      basmalaAdded: false,
      slug,
      isComplete: Boolean(isComplete),
      processingStatus: 'processing',
      processingError: null
    });

    await createAudioStats(audio.id);
    await scheduleAudioProcessing({
      audioId,
      filePath: resolvedUploadPath,
      addBasmala
    });
    await updateAudio(audio.id, { processing_started_at: new Date() });
    return audio;
  }

  let processed;
  try {
    processed = await processUploadedFile({ filePath: resolvedUploadPath, addBasmala });
  } catch (err) {
    if (err?.message === 'No audio stream found') {
      throw new AppError('No audio stream found', 400);
    }
    if (err?.message === 'Uploaded file failed virus scan') {
      throw new AppError('Uploaded file failed virus scan', 422);
    }
    if (err?.message === 'Virus scanner not available') {
      throw new AppError('Virus scanner not available', 503);
    }
    throw new AppError('Audio processing failed', 500, { reason: err?.message });
  }

  const audio = await createAudio({
    id: audioId,
    title,
    sourate: canonicalName,
    numeroSourate,
    versetStart: normalizedRange.start,
    versetEnd: normalizedRange.end,
    description,
    i18n,
    filePath: processed.finalPath,
    streamPath: processed.streamPath,
    basmalaAdded: processed.basmalaAdded,
    slug,
    isComplete: Boolean(isComplete),
    processingStatus: 'ready',
    processingError: null
  });

  await createAudioStats(audio.id);
  return audio;
}

// List audios, optionally filtered by sourate.
export async function listAllAudios({ sourate, includeProcessing = false }) {
  return listAudios({ sourate, includeProcessing });
}

// Advanced search with pagination and dynamic sorting.
export async function searchAudio(params) {
  return searchAudios(params);
}

// Ranking endpoints.
export async function getPopular(limit) {
  return listPopular(limit);
}

export async function getTopListened(limit) {
  return listTopListened(limit);
}

export async function getTopDownloaded(limit) {
  return listTopDownloaded(limit);
}

export async function getRecent(limit) {
  return listRecent(limit);
}

// Get audio by id or throw.
export async function getAudio(id) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  return audio;
}

// Get audio and increment view count.
export async function getAudioWithViewIncrement(id) {
  const audio = await getAudio(id);
  await incrementView(id);
  return audio;
}

// Get audio by slug for public access.
export async function getPublicAudioBySlug(slug) {
  const audio = await getAudioBySlug(slug);
  if (!audio) throw new AppError('Audio not found', 404);
  if (audio.processing_status && audio.processing_status !== 'ready') {
    throw new AppError('Audio not ready', 409);
  }
  return audio;
}

// Get public audio and increment view count.
export async function getPublicAudioWithViewIncrement(slug) {
  const audio = await getPublicAudioBySlug(slug);
  await incrementView(audio.id);
  return audio;
}

// Public share increments share count and returns audio.
export async function sharePublicAudio(slug) {
  const audio = await getPublicAudioBySlug(slug);
  await incrementShare(audio.id);
  return audio;
}

// Update metadata fields for an audio.
export async function updateAudioMetadata(id, payload) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  const shouldValidateSurah =
    payload.numeroSourate !== undefined || payload.sourate !== undefined;
  const shouldValidateRange =
    shouldValidateSurah ||
    payload.versetStart !== undefined ||
    payload.versetEnd !== undefined ||
    payload.isComplete !== undefined;

  let canonicalName;
  let normalizedRange;
  const numero = payload.numeroSourate ?? audio.numero_sourate;
  if (shouldValidateSurah) {
    const surah = getSurahByNumber(numero);
    if (!surah) {
      throw new AppError('Invalid surah number', 400);
    }
    canonicalName = resolveSurahName(numero, payload.sourate ?? surah.name_ar);
    if (!canonicalName) {
      throw new AppError('Invalid surah name for selected number', 400);
    }
  }

  if (shouldValidateRange) {
    if (!getSurahByNumber(numero)) {
      throw new AppError('Invalid surah number', 400);
    }
    const surah = getSurahByNumber(numero);
    const isComplete = payload.isComplete ?? audio.is_complete;
    const currentStart = isComplete ? 1 : payload.versetStart ?? audio.verset_start;
    const currentEnd = isComplete ? surah.verses : payload.versetEnd ?? audio.verset_end;
    normalizedRange = normalizeVerseRange(currentStart, currentEnd);
    if (!validateVerseRange(numero, normalizedRange.start, normalizedRange.end)) {
      throw new AppError('Invalid verse range for selected surah', 400);
    }
    const titleForCheck = payload.title ?? audio.title;
    const sourateForCheck = canonicalName ?? audio.sourate;
    const duplicate = await findDuplicateAudio({
      title: titleForCheck,
      sourate: sourateForCheck,
      versetStart: normalizedRange.start,
      versetEnd: normalizedRange.end,
      excludeId: audio.id
    });
    if (duplicate) {
      throw new AppError('Duplicate recitation (same title, surah, and verse range)', 409);
    }
  }

  const mapped = {
    title: payload.title,
    sourate: canonicalName,
    numero_sourate: payload.numeroSourate,
    verset_start: normalizedRange ? normalizedRange.start : payload.versetStart,
    verset_end: normalizedRange ? normalizedRange.end : payload.versetEnd,
    description: payload.description,
    i18n: payload.i18n,
    is_complete: payload.isComplete
  };
  const cleaned = Object.fromEntries(
    Object.entries(mapped).filter(([, value]) => value !== undefined)
  );
  if (Object.keys(cleaned).length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Regenerate slug if title or numero_sourate changes.
  if (cleaned.title || cleaned.numero_sourate) {
    const newNumero = cleaned.numero_sourate ?? audio.numero_sourate;
    const newTitle = cleaned.title ?? audio.title;
    const baseSlug = `${newNumero}-${slugify(newTitle)}`;
    cleaned.slug = await ensureUniqueSlug(baseSlug, audio.id);
  }

  return updateAudio(id, cleaned);
}

// Remove audio metadata and associated file on disk.
export async function removeAudio(id) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  await deleteAudio(id);
  try {
    await fs.unlink(audio.file_path);
  } catch (err) {
    // Ignore missing file
  }
}

/**
 * Stream audio file with HTTP range support.
 */
function contentTypeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.mp4') return 'audio/mp4';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.ogg' || ext === '.opus') return 'audio/ogg';
  if (ext === '.webm' || ext === '.weba') return 'audio/webm';
  if (ext === '.mka' || ext === '.mkv') return 'audio/x-matroska';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.wav') return 'audio/wav';
  return 'application/octet-stream';
}

async function streamFile(res, filePath, range) {
  const stat = await fs.stat(filePath);
  const fileSize = stat.size;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentTypeForPath(filePath));

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize
    });

    const stream = (await import('fs')).createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize
    });
    const stream = (await import('fs')).createReadStream(filePath);
    stream.pipe(res);
  }

}

export async function streamAudio(res, id, range) {
  const audio = await getAudio(id);
  const streamPath = await ensureStreamPathForAudio(audio);
  await streamFile(res, streamPath, range);
  await incrementListen(id);
}

// Public stream by slug.
export async function streamPublicAudio(res, slug, range) {
  const audio = await getPublicAudioBySlug(slug);
  const streamPath = await ensureStreamPathForAudio(audio);
  await streamFile(res, streamPath, range);
  await incrementListen(audio.id);
}

// Force file download and increment counter.
export async function downloadAudio(res, id) {
  const audio = await getAudio(id);
  await incrementDownload(id);
  const resolvedPath = resolveStoredPath(audio.file_path);
  const ext = path.extname(resolvedPath || '').toLowerCase();
  const filename = await buildDownloadFilename(audio, ext);
  return res.download(resolvedPath, filename);
}

// Public download by slug.
export async function downloadPublicAudio(res, slug) {
  const audio = await getPublicAudioBySlug(slug);
  await incrementDownload(audio.id);
  const resolvedPath = resolveStoredPath(audio.file_path);
  const ext = path.extname(resolvedPath || '').toLowerCase();
  const filename = await buildDownloadFilename(audio, ext);
  return res.download(resolvedPath, filename);
}

// List favorite audio IDs for a user.
export async function listFavoritesForUser(userId) {
  return listFavoriteAudioIds(userId);
}

// Toggle favorite for a user and return like count.
export async function toggleFavoriteForUser(userId, audioId) {
  const audio = await getAudioById(audioId);
  if (!audio) throw new AppError('Audio not found', 404);
  return toggleFavorite(userId, audioId);
}
