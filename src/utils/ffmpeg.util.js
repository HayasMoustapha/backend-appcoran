import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Ensure ffmpeg is available on PATH.
 */
export async function ensureFfmpegAvailable() {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', (err) => reject(err));
    proc.on('exit', (code) => {
      if (code === 0) return resolve();
      return reject(new Error('ffmpeg not available'));
    });
  });
}

/**
 * Merge basmala audio with a lecture audio file.
 */
export async function mergeWithBasmala({
  inputPath,
  basmalaPath,
  outputPath,
  timeoutMs = 60000
}) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
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
      outputPath
    ];

    const proc = spawn('ffmpeg', args);

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
