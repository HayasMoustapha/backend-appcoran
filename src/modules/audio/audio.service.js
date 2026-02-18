import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { processBasmala } from './audio.processor.js';
import {
  createAudio,
  createAudioStats,
  deleteAudio,
  getAudioById,
  incrementDownload,
  incrementListen,
  listAudios,
  updateAudio
} from './audio.repository.js';

/**
 * Create a new audio entry, optionally prefixing basmala.
 */
export async function createAudioEntry({
  title,
  sourate,
  versetStart,
  versetEnd,
  description,
  filePath,
  addBasmala
}) {
  let finalPath = filePath;
  let basmalaAdded = false;

  if (addBasmala) {
    finalPath = await processBasmala({
      inputPath: filePath,
      basmalaPath: env.basmalaPath,
      outputDir: env.uploadDir
    });
    basmalaAdded = true;
    if (!env.keepOriginalAudio) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  const audio = await createAudio({
    id: uuidv4(),
    title,
    sourate,
    versetStart,
    versetEnd,
    description,
    filePath: finalPath,
    basmalaAdded
  });

  await createAudioStats(audio.id);
  return audio;
}

export async function listAllAudios({ sourate }) {
  return listAudios({ sourate });
}

export async function getAudio(id) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  return audio;
}

export async function updateAudioMetadata(id, payload) {
  const audio = await getAudioById(id);
  if (!audio) throw new AppError('Audio not found', 404);
  const mapped = {
    title: payload.title,
    sourate: payload.sourate,
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
  return updateAudio(id, cleaned);
}

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
export async function streamAudio(res, id, range) {
  const audio = await getAudio(id);
  const filePath = audio.file_path;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'audio/mpeg');
  res.sendFile(filePath);

  await incrementListen(id);
}

export async function downloadAudio(res, id) {
  const audio = await getAudio(id);
  await incrementDownload(id);
  return res.download(audio.file_path);
}
