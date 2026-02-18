import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { mergeWithBasmala } from '../../utils/ffmpeg.util.js';

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
