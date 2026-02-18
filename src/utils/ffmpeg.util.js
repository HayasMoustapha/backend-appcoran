import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Ensure ffmpeg is available on PATH by invoking `ffmpeg -version`.
 */
export async function ensureFfmpegAvailable(ffmpegPath = 'ffmpeg') {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-version']);
    proc.on('error', (err) => reject(err));
    proc.on('exit', (code) => {
      if (code === 0) return resolve();
      return reject(new Error('ffmpeg not available'));
    });
  });
}

/**
 * Merge basmala audio with a lecture audio file using FFmpeg concat.
 */
export async function mergeWithBasmala({
  inputPath,
  basmalaPath,
  outputPath,
  ffmpegPath = 'ffmpeg',
  timeoutMs = 60000
}) {
  // Ensure output directory exists.
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    // Concatenate basmala + lecture into a single output file.
    const ext = path.extname(outputPath).toLowerCase();
    const audioCodec =
      ext === '.mp3'
        ? 'libmp3lame'
        : ext === '.mp4' || ext === '.m4a' || ext === '.aac'
          ? 'aac'
          : 'libmp3lame';

    const args = [
      '-y',
      '-i',
      basmalaPath,
      '-i',
      inputPath,
      '-filter_complex',
      'concat=n=2:v=0:a=1[out]',
      '-map',
      '[out]',
      '-c:a',
      audioCodec,
      outputPath
    ];

    const proc = spawn(ffmpegPath, args);

    // Enforce processing timeout to avoid hanging processes.
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('ffmpeg timeout'));
    }, timeoutMs);

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(outputPath);
      return reject(new Error('ffmpeg merge failed'));
    });
  });
}
