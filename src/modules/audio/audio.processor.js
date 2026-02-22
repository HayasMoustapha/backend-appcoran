import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { extractAudio, mergeWithBasmala, probeMedia, transcodeToMp3 } from '../../utils/ffmpeg.util.js';
import { sniffFileType, isAllowedExtension, isAllowedMime } from '../../utils/fileValidation.util.js';
import { buildSpacesKey, uploadFileToSpaces } from '../../utils/spaces.util.js';
import { isVirusScannerAvailable, scanFileForViruses } from '../../utils/virusScan.util.js';
import { updateAudio } from './audio.repository.js';

const AUDIO_EXT_BY_CODEC = {
  aac: '.m4a',
  mp3: '.mp3',
  opus: '.ogg',
  vorbis: '.ogg',
  flac: '.flac',
  alac: '.m4a',
  pcm_s16le: '.wav',
  pcm_s24le: '.wav',
  pcm_f32le: '.wav'
};

function pickAudioExtension(codec) {
  return AUDIO_EXT_BY_CODEC[codec] || '.mka';
}

function hasVideoStream(streams) {
  return streams?.some((stream) => stream.codec_type === 'video');
}

function hasAudioStream(streams) {
  return streams?.some((stream) => stream.codec_type === 'audio');
}

const STREAMABLE_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.ogg',
  '.flac',
  '.webm'
]);

function isStreamableExtension(filePath) {
  return STREAMABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function contentTypeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.m4a' || ext === '.mp4') return 'audio/mp4';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.ogg' || ext === '.opus') return 'audio/ogg';
  if (ext === '.webm' || ext === '.weba') return 'audio/webm';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.wav') return 'audio/wav';
  return 'application/octet-stream';
}

function resolveStoredPath(filePath) {
  if (!filePath) return filePath;
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(env.uploadDir, '..', filePath);
}

async function runVirusScan(filePath) {
  if (!env.virusScanEnabled && !env.virusScanAuto) return;
  const available = await isVirusScannerAvailable({
    tool: env.virusScanTool,
    timeoutMs: env.virusScanTimeoutMs
  });
  if (!available) {
    if (env.virusScanEnabled) {
      throw new Error('Virus scanner not available');
    }
    return;
  }
  try {
    const result = await scanFileForViruses({
      filePath,
      tool: env.virusScanTool,
      timeoutMs: env.virusScanTimeoutMs
    });
    if (!result.clean) {
      throw new Error('Uploaded file failed virus scan');
    }
  } catch (err) {
    if (env.virusScanEnabled) {
      throw err;
    }
    logger.warn({ err }, 'Virus scan failed (non-blocking)');
  }
}

export async function processUploadedFile({
  audioId,
  filePath,
  addBasmala
}) {
  const resolvedUploadPath = resolveStoredPath(filePath);
  let finalPath = resolvedUploadPath;
  let intermediatePath = finalPath;
  let basmalaAdded = false;
  let streamPath = null;

  const ext = path.extname(resolvedUploadPath).toLowerCase();
  const sniffed = await sniffFileType(resolvedUploadPath);
  const sniffedMime = sniffed?.mime || '';
  if (!isAllowedExtension(ext) && !isAllowedMime(sniffedMime)) {
    throw new Error('Unsupported audio format');
  }

  await runVirusScan(resolvedUploadPath);

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
    if (!env.ffmpegRequired) {
      prepared = { audioPath: filePath, extracted: false };
    } else if (message.includes('No audio stream found')) {
      throw new Error('No audio stream found');
    } else {
      throw new Error('Audio processing failed');
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
    await fs.access(env.basmalaPath, fsConstants.F_OK);
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
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  if (!isStreamableExtension(finalPath)) {
    try {
      const mp3Path = path.join(env.uploadDir, `${uuidv4()}_stream.mp3`);
      await transcodeToMp3({
        inputPath: resolveStoredPath(finalPath),
        outputPath: mp3Path,
        ffmpegPath: env.ffmpegPath,
        bitrateKbps: env.audioTargetBitrateKbps,
        vbrQuality: env.audioVbrQuality,
        loudnorm: env.audioLoudnorm,
        stripMetadata: true
      });
      streamPath = mp3Path;
    } catch (err) {
      logger.error({ err }, 'MP3 conversion failed for new upload');
      streamPath = null;
    }
  } else {
    streamPath = finalPath;
  }

  const metaInfo = await probeMedia(streamPath || finalPath, env.ffprobePath);
  const durationSeconds = Math.round(Number(metaInfo.format?.duration || 0));
  const bitrateKbps = Math.round(Number(metaInfo.format?.bit_rate || 0) / 1000);
  if (env.audioMaxDurationSeconds > 0 && durationSeconds > env.audioMaxDurationSeconds) {
    throw new Error('Audio duration exceeds limit');
  }

  const localPath = streamPath || finalPath;
  const stat = await fs.stat(localPath);

  let publicUrl = null;
  if (env.spacesEnabled) {
    const key = buildSpacesKey({
      audioId,
      filename: path.basename(localPath)
    });
    publicUrl = await uploadFileToSpaces({
      filePath: localPath,
      key,
      contentType: contentTypeForPath(localPath)
    });
    if (publicUrl && !env.keepOriginalAudio) {
      try {
        await fs.unlink(localPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  return {
    finalPath: publicUrl || finalPath,
    streamPath: publicUrl || streamPath,
    basmalaAdded,
    durationSeconds,
    bitrateKbps,
    sizeBytes: stat.size
  };
}

export async function processAudioUploadJob(data) {
  const { audioId, filePath, addBasmala } = data;
  try {
    const result = await processUploadedFile({ audioId, filePath, addBasmala });
    await updateAudio(audioId, {
      file_path: result.finalPath,
      stream_path: result.streamPath,
      basmala_added: result.basmalaAdded,
      processing_status: 'completed',
      processing_error: null,
      duration_seconds: result.durationSeconds,
      bitrate_kbps: result.bitrateKbps,
      size_bytes: result.sizeBytes,
      processing_completed_at: new Date()
    });
    logger.info({ audioId }, 'Audio processing completed');
    return true;
  } catch (err) {
    const resolvedPath = resolveStoredPath(filePath);
    const fallbackStream = isStreamableExtension(resolvedPath) ? resolvedPath : null;
    await updateAudio(audioId, {
      file_path: resolvedPath,
      stream_path: fallbackStream,
      basmala_added: false,
      processing_status: 'failed',
      processing_error: err?.message || 'Audio processing failed',
      processing_completed_at: new Date()
    });
    logger.error({ err, audioId }, 'Audio processing failed');
    throw err;
  }
}

// Prepare and run basmala merge, returning the new file path.
export async function processBasmala({
  inputPath,
  basmalaPath,
  outputDir,
  ffmpegPath
}) {
  await fs.access(basmalaPath, fsConstants.F_OK);
  const inputExt = path.extname(inputPath).toLowerCase();
  const outputExt =
    inputExt === '.webm' || inputExt === '.weba' || inputExt === '.ogg'
      ? '.mp3'
      : inputExt;
  const outputPath = path.join(outputDir, `${uuidv4()}_basmala${outputExt}`);
  await mergeWithBasmala({ inputPath, basmalaPath, outputPath, ffmpegPath });
  return outputPath;
}

// Extract audio if the uploaded file contains video, otherwise keep original.
export async function prepareAudioFile({
  inputPath,
  outputDir,
  ffmpegPath,
  ffprobePath
}) {
  const info = await probeMedia(inputPath, ffprobePath);
  const audioStream = info.streams?.find((stream) => stream.codec_type === 'audio');
  if (!audioStream) {
    throw new Error('No audio stream found');
  }

  if (!hasVideoStream(info.streams)) {
    return { audioPath: inputPath, extracted: false, codec: audioStream.codec_name };
  }

  const ext = pickAudioExtension(audioStream.codec_name);
  const outputPath = path.join(outputDir, `${uuidv4()}_audio${ext}`);
  await extractAudio({ inputPath, outputPath, ffmpegPath });
  const extractedInfo = await probeMedia(outputPath, ffprobePath);
  if (!hasAudioStream(extractedInfo.streams)) {
    const mp3Path = path.join(outputDir, `${uuidv4()}_audio.mp3`);
    await transcodeToMp3({
      inputPath,
      outputPath: mp3Path,
      ffmpegPath,
      bitrateKbps: env.audioTargetBitrateKbps,
      vbrQuality: env.audioVbrQuality,
      loudnorm: env.audioLoudnorm,
      stripMetadata: true
    });
    const mp3Info = await probeMedia(mp3Path, ffprobePath);
    if (!hasAudioStream(mp3Info.streams)) {
      throw new Error('Audio extraction failed');
    }
    return { audioPath: mp3Path, extracted: true, codec: 'mp3' };
  }
  return { audioPath: outputPath, extracted: true, codec: audioStream.codec_name };
}
