import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { createTaskQueue } from '../../utils/taskQueue.js';
import { extractAudio, mergeWithBasmala, probeMedia, transcodeToMp3 } from '../../utils/ffmpeg.util.js';
import { registerAudioJob, runAudioJob, enqueueAudioJob } from '../../utils/audioQueue.js';
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

function resolveStoredPath(filePath) {
  if (!filePath) return filePath;
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(env.uploadDir, '..', filePath);
}

registerAudioJob('mergeBasmala', (data) =>
  mergeWithBasmala({
    inputPath: data.inputPath,
    basmalaPath: data.basmalaPath,
    outputPath: data.outputPath,
    ffmpegPath: data.ffmpegPath
  })
);

registerAudioJob('extractAudio', (data) =>
  extractAudio({
    inputPath: data.inputPath,
    outputPath: data.outputPath,
    ffmpegPath: data.ffmpegPath
  })
);

registerAudioJob('transcodeMp3', (data) =>
  transcodeToMp3({
    inputPath: data.inputPath,
    outputPath: data.outputPath,
    ffmpegPath: data.ffmpegPath
  })
);

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
  const result = await scanFileForViruses({
    filePath,
    tool: env.virusScanTool,
    timeoutMs: env.virusScanTimeoutMs
  });
  if (!result.clean) {
    throw new Error('Uploaded file failed virus scan');
  }
}

export async function processUploadedFile({
  filePath,
  addBasmala
}) {
  const resolvedUploadPath = resolveStoredPath(filePath);
  let finalPath = resolvedUploadPath;
  let intermediatePath = finalPath;
  let basmalaAdded = false;
  let streamPath = null;

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
        ffmpegPath: env.ffmpegPath
      });
      streamPath = mp3Path;
    } catch (err) {
      logger.error({ err }, 'MP3 conversion failed for new upload');
      streamPath = null;
    }
  } else {
    streamPath = finalPath;
  }

  return { finalPath, streamPath, basmalaAdded };
}

export async function processAudioUploadJob(data) {
  const { audioId, filePath, addBasmala } = data;
  try {
    const result = await processUploadedFile({ filePath, addBasmala });
    await updateAudio(audioId, {
      file_path: result.finalPath,
      stream_path: result.streamPath,
      basmala_added: result.basmalaAdded,
      processing_status: 'ready',
      processing_error: null,
      processing_completed_at: new Date()
    });
    logger.info({ audioId }, 'Audio processing completed');
    return true;
  } catch (err) {
    await updateAudio(audioId, {
      processing_status: 'failed',
      processing_error: err?.message || 'Audio processing failed',
      processing_completed_at: new Date()
    });
    logger.error({ err, audioId }, 'Audio processing failed');
    throw err;
  }
}

registerAudioJob('processUpload', (data) => processAudioUploadJob(data));

const fallbackQueue = createTaskQueue(env.audioQueueConcurrency || 1);

export async function scheduleAudioProcessing(data) {
  const queued = await enqueueAudioJob('processUpload', data);
  if (queued) {
    return true;
  }
  fallbackQueue.enqueue(() => processAudioUploadJob(data)).catch((err) => {
    logger.error({ err, audioId: data?.audioId }, 'Background audio processing failed');
  });
  return false;
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
  await runAudioJob(
    'mergeBasmala',
    { inputPath, basmalaPath, outputPath, ffmpegPath },
    () => mergeWithBasmala({ inputPath, basmalaPath, outputPath, ffmpegPath })
  );
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
  await runAudioJob(
    'extractAudio',
    { inputPath, outputPath, ffmpegPath },
    () => extractAudio({ inputPath, outputPath, ffmpegPath })
  );
  const extractedInfo = await probeMedia(outputPath, ffprobePath);
  if (!hasAudioStream(extractedInfo.streams)) {
    const mp3Path = path.join(outputDir, `${uuidv4()}_audio.mp3`);
    await runAudioJob(
      'transcodeMp3',
      { inputPath, outputPath: mp3Path, ffmpegPath },
      () => transcodeToMp3({ inputPath, outputPath: mp3Path, ffmpegPath })
    );
    const mp3Info = await probeMedia(mp3Path, ffprobePath);
    if (!hasAudioStream(mp3Info.streams)) {
      throw new Error('Audio extraction failed');
    }
    return { audioPath: mp3Path, extracted: true, codec: 'mp3' };
  }
  return { audioPath: outputPath, extracted: true, codec: audioStream.codec_name };
}
