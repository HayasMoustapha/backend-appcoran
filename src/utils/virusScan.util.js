import { spawn } from 'child_process';

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
