import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractAudio, mergeWithBasmala, probeMedia } from '../../utils/ffmpeg.util.js';

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

// Prepare and run basmala merge, returning the new file path.
export async function processBasmala({
  inputPath,
  basmalaPath,
  outputDir,
  ffmpegPath
}) {
  await fs.access(basmalaPath, fsConstants.F_OK);
  const ext = path.extname(inputPath);
  const outputPath = path.join(outputDir, `${uuidv4()}_basmala${ext}`);
  await mergeWithBasmala({
    inputPath,
    basmalaPath,
    outputPath,
    ffmpegPath
  });
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
  await extractAudio({
    inputPath,
    outputPath,
    ffmpegPath
  });
  return { audioPath: outputPath, extracted: true, codec: audioStream.codec_name };
}
