import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { ensureFfmpegAvailable } from '../../utils/ffmpeg.util.js';
import { prepareAudioFile, processBasmala } from './audio.processor.js';
import {
  createAudio,
  createAudioStats,
  deleteAudio,
  getAudioById,
  getAudioBySlug,
  incrementView,
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
  let finalPath = filePath;
  let intermediatePath = finalPath;
  let basmalaAdded = false;

  // Normalize uploaded media to audio-only when needed.
  let prepared;
  try {
    prepared = await prepareAudioFile({
      inputPath: filePath,
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
        await fs.unlink(filePath);
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

  const baseSlug = `${numeroSourate}-${slugify(title)}`;
  const slug = await ensureUniqueSlug(baseSlug);

  const audio = await createAudio({
    id: uuidv4(),
    title,
    sourate,
    numeroSourate,
    versetStart,
    versetEnd,
    description,
    filePath: finalPath,
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

// Update metadata fields for an audio.
export async function updateAudioMetadata(id, payload) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  const mapped = {
    title: payload.title,
    sourate: payload.sourate,
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
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.ogg' || ext === '.opus') return 'audio/ogg';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.wav') return 'audio/wav';
  return 'application/octet-stream';
}

export async function streamAudio(res, id, range) {
  const audio = await getAudio(id);
  const filePath = audio.file_path;
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

  await incrementListen(id);
}

// Force file download and increment counter.
export async function downloadAudio(res, id) {
  const audio = await getAudio(id);
  await incrementDownload(id);
  return res.download(audio.file_path);
}
