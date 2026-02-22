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
 * Ensure ffprobe is available on PATH by invoking `ffprobe -version`.
 */
export async function ensureFfprobeAvailable(ffprobePath = 'ffprobe') {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffprobePath, ['-version']);
    proc.on('error', (err) => reject(err));
    proc.on('exit', (code) => {
      if (code === 0) return resolve();
      return reject(new Error('ffprobe not available'));
    });
  });
}

/**
 * Inspect media streams using ffprobe (returns JSON).
 */
export async function probeMedia(inputPath, ffprobePath = 'ffprobe', timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const args = ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', inputPath];
    const proc = spawn(ffprobePath, args);
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('ffprobe timeout'));
    }, timeoutMs);

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr || 'ffprobe failed'));
      try {
        const parsed = JSON.parse(stdout);
        return resolve(parsed);
      } catch (err) {
        return reject(err);
      }
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

/**
 * Extract audio from any media file. Prefer stream copy, fallback to AAC re-encode.
 */
export async function extractAudio({
  inputPath,
  outputPath,
  ffmpegPath = 'ffmpeg',
  timeoutMs = 60000
}) {
  // Ensure output directory exists.
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, args);
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
        return reject(new Error('ffmpeg extract failed'));
      });
    });

  // First try: stream copy to preserve original quality.
  try {
    await runFfmpeg(['-y', '-i', inputPath, '-vn', '-c:a', 'copy', outputPath]);
    return outputPath;
  } catch (err) {
    // Fallback: high-quality AAC transcode for broad compatibility.
    await runFfmpeg(['-y', '-i', inputPath, '-vn', '-c:a', 'aac', '-q:a', '2', outputPath]);
    return outputPath;
  }
}

/**
 * Transcode audio to MP3 (fallback for compatibility).
 */
export async function transcodeToMp3({
  inputPath,
  outputPath,
  ffmpegPath = 'ffmpeg',
  timeoutMs = 60000,
  bitrateKbps,
  vbrQuality,
  loudnorm = true,
  stripMetadata = true
}) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', inputPath, '-vn', '-c:a', 'libmp3lame'];
    if (typeof bitrateKbps === 'number' && bitrateKbps > 0) {
      args.push('-b:a', `${bitrateKbps}k`);
    } else {
      args.push('-q:a', String(typeof vbrQuality === 'number' ? vbrQuality : 2));
    }
    if (loudnorm) {
      args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }
    if (stripMetadata) {
      args.push('-map_metadata', '-1', '-id3v2_version', '3');
    }
    args.push(outputPath);
    const proc = spawn(ffmpegPath, args);

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
      return reject(new Error('ffmpeg transcode failed'));
    });
  });
}
