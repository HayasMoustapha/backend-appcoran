import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import logger from '../../config/logger.js';
import { ensureFfmpegAvailable } from '../../utils/ffmpeg.util.js';
import {
  getSurahByNumber,
  normalizeVerseRange,
  resolveSurahName,
  validateVerseRange
} from '../../utils/surahReference.js';
import { prepareAudioFile, processBasmala } from './audio.processor.js';
import {
  createAudio,
  createAudioStats,
  deleteAudio,
  getAudioById,
  getAudioBySlug,
  incrementView,
  incrementShare,
  incrementDownload,
  incrementListen,
  listAudios,
  listPopular,
  listRecent,
  listTopDownloaded,
  listTopListened,
  searchAudios,
  updateAudio
} from './audio.repository.js';

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

const STREAMABLE_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.wav'
]);

function isStreamableExtension(filePath) {
  return STREAMABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function resolveStoredPath(filePath) {
  if (!filePath) return filePath;
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(env.uploadDir, '..', filePath);
}

async function ensureStreamPathForAudio(audio) {
  const candidatePath = resolveStoredPath(audio.stream_path || audio.file_path);
  if (isStreamableExtension(candidatePath)) {
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
  filePath,
  addBasmala
}) {
  const surah = getSurahByNumber(numeroSourate);
  if (!surah) {
    throw new AppError('Invalid surah number', 400);
  }
  const canonicalName = resolveSurahName(numeroSourate, sourate);
  if (!canonicalName) {
    throw new AppError('Invalid surah name for selected number', 400);
  }
  const normalizedRange = normalizeVerseRange(versetStart, versetEnd);
  if (!validateVerseRange(numeroSourate, normalizedRange.start, normalizedRange.end)) {
    throw new AppError('Invalid verse range for selected surah', 400);
  }

  const resolvedUploadPath = resolveStoredPath(filePath);
  let finalPath = resolvedUploadPath;
  let intermediatePath = finalPath;
  let basmalaAdded = false;
  let streamPath = null;

  // Normalize uploaded media to audio-only when needed.
  let prepared;
  try {
    prepared = await prepareAudioFile({
      inputPath: resolvedUploadPath,
      outputDir: env.uploadDir,
      ffmpegPath: env.ffmpegPath,
      ffprobePath: env.ffprobePath
    });
  } catch (err) {
    const message = err?.message || 'Audio processing failed';
    // If media processing is optional, skip extraction on any failure.
    if (!env.ffmpegRequired) {
      prepared = { audioPath: filePath, extracted: false };
    } else if (message.includes('No audio stream found')) {
      throw new AppError('No audio stream found', 400);
    } else {
      throw new AppError('Audio processing failed', 500, { reason: message });
    }
  }

  if (prepared.extracted && prepared.audioPath !== filePath) {
    finalPath = prepared.audioPath;
    intermediatePath = prepared.audioPath;
    if (!env.keepOriginalAudio) {
      try {
        await fs.unlink(resolvedUploadPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  if (addBasmala) {
    try {
      await ensureFfmpegAvailable(env.ffmpegPath);
    } catch (err) {
      throw new AppError('FFmpeg not available to add basmala', 503);
    }
    finalPath = await processBasmala({
      inputPath: intermediatePath,
      basmalaPath: env.basmalaPath,
      outputDir: env.uploadDir,
      ffmpegPath: env.ffmpegPath
    });
    basmalaAdded = true;
    if (!env.keepOriginalAudio) {
      try {
        if (intermediatePath && intermediatePath !== finalPath) {
          await fs.unlink(intermediatePath);
        } else if (filePath !== finalPath) {
          await fs.unlink(filePath);
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  } else if (!env.keepOriginalAudio && intermediatePath !== filePath) {
    // If we extracted audio from video and we're not keeping originals, remove the original upload.
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  // Ensure a streamable format for the browser (generate mp3 if needed).
  if (!isStreamableExtension(finalPath)) {
    try {
      await ensureFfmpegAvailable(env.ffmpegPath);
      logger.info(
        {
          sourcePath: resolveStoredPath(finalPath)
        },
        'Starting MP3 conversion for new upload'
      );
      const mp3Path = path.join(env.uploadDir, `${uuidv4()}_stream.mp3`);
      await transcodeToMp3({
        inputPath: resolveStoredPath(finalPath),
        outputPath: mp3Path,
        ffmpegPath: env.ffmpegPath
      });
      logger.info(
        {
          streamPath: mp3Path
        },
        'MP3 conversion completed for new upload'
      );
      streamPath = mp3Path;
    } catch (err) {
      logger.error({ err }, 'MP3 conversion failed for new upload');
      // Do not fail the upload; stream conversion will retry on demand.
      streamPath = null;
    }
  } else {
    streamPath = finalPath;
  }

  const baseSlug = `${numeroSourate}-${slugify(title)}`;
  const slug = await ensureUniqueSlug(baseSlug);

  const audio = await createAudio({
    id: uuidv4(),
    title,
    sourate: canonicalName,
    numeroSourate,
    versetStart: normalizedRange.start,
    versetEnd: normalizedRange.end,
    description,
    filePath: finalPath,
    streamPath,
    basmalaAdded,
    slug
  });

  await createAudioStats(audio.id);
  return audio;
}

// List audios, optionally filtered by sourate.
export async function listAllAudios({ sourate }) {
  return listAudios({ sourate });
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
    payload.versetEnd !== undefined;

  let canonicalName;
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
    const currentStart = payload.versetStart ?? audio.verset_start;
    const currentEnd = payload.versetEnd ?? audio.verset_end;
    const normalizedRange = normalizeVerseRange(currentStart, currentEnd);
    if (!validateVerseRange(numero, normalizedRange.start, normalizedRange.end)) {
      throw new AppError('Invalid verse range for selected surah', 400);
    }
  }

  const mapped = {
    title: payload.title,
    sourate: canonicalName,
    numero_sourate: payload.numeroSourate,
    verset_start: payload.versetStart,
    verset_end: payload.versetEnd,
    description: payload.description
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
  const filename = `${audio.slug || audio.id}${ext || ''}`;
  return res.download(resolvedPath, filename);
}

// Public download by slug.
export async function downloadPublicAudio(res, slug) {
  const audio = await getPublicAudioBySlug(slug);
  await incrementDownload(audio.id);
  const resolvedPath = resolveStoredPath(audio.file_path);
  const ext = path.extname(resolvedPath || '').toLowerCase();
  const filename = `${audio.slug || audio.id}${ext || ''}`;
  return res.download(resolvedPath, filename);
}
