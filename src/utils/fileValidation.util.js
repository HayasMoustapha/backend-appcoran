import fs from 'fs/promises';

const ALLOWED_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/flac',
  'audio/webm'
]);

function startsWith(buffer, ascii) {
  return buffer.slice(0, ascii.length).toString('ascii') === ascii;
}

function hasMp3FrameSync(buffer) {
  if (buffer.length < 2) return false;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function detectMime(buffer) {
  if (startsWith(buffer, 'ID3') || hasMp3FrameSync(buffer)) {
    return { ext: 'mp3', mime: 'audio/mpeg' };
  }
  if (startsWith(buffer, 'RIFF') && buffer.slice(8, 12).toString('ascii') === 'WAVE') {
    return { ext: 'wav', mime: 'audio/wav' };
  }
  if (startsWith(buffer, 'OggS')) {
    return { ext: 'ogg', mime: 'audio/ogg' };
  }
  if (startsWith(buffer, 'fLaC')) {
    return { ext: 'flac', mime: 'audio/flac' };
  }
  if (buffer.length > 12 && buffer.slice(4, 8).toString('ascii') === 'ftyp') {
    return { ext: 'mp4', mime: 'audio/mp4' };
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { ext: 'webm', mime: 'audio/webm' };
  }
  return null;
}

export async function sniffFileType(filePath) {
  const buffer = await fs.readFile(filePath);
  const type = detectMime(buffer);
  return type || null;
}

export function isAllowedMime(mime) {
  if (!mime) return false;
  return ALLOWED_MIME.has(mime);
}

export function isAllowedExtension(ext) {
  const allowed = new Set(['.mp3', '.mp4', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.webm']);
  return allowed.has(ext.toLowerCase());
}
