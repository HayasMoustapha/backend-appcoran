import { spawn } from 'child_process';

const availabilityCache = new Map();

export async function isVirusScannerAvailable({
  tool = 'clamscan',
  timeoutMs = 60000
} = {}) {
  if (availabilityCache.has(tool)) {
    return availabilityCache.get(tool);
  }
  const available = await new Promise((resolve) => {
    const proc = spawn(tool, ['--version']);
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve(false);
    }, timeoutMs);
    proc.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
  availabilityCache.set(tool, available);
  return available;
}

export async function scanFileForViruses({
  filePath,
  tool = 'clamscan',
  timeoutMs = 60000
}) {
  return new Promise((resolve, reject) => {
    const args = ['--no-summary', '--infected', filePath];
    const proc = spawn(tool, args);
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('virus scan timeout'));
    }, timeoutMs);

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve({ clean: true });
      if (code === 1) return resolve({ clean: false });
      return reject(new Error(stderr || 'virus scan failed'));
    });
  });
}
