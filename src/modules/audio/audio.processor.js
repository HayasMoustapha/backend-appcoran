import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mergeWithBasmala } from '../../utils/ffmpeg.util.js';

export async function processBasmala({
  inputPath,
  basmalaPath,
  outputDir
}) {
  const ext = path.extname(inputPath);
  const outputPath = path.join(outputDir, `${uuidv4()}_basmala${ext}`);
  await mergeWithBasmala({
    inputPath,
    basmalaPath,
    outputPath
  });
  return outputPath;
}
