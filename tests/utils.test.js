import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

// response util
import { ok } from '../src/utils/response.util.js';

describe('response.util', () => {
  it('returns json response with status', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    ok(res, { a: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ a: 1 });
  });

  it('defaults to status 200', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    ok(res, { a: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('ffmpeg.util', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('ensureFfmpegAvailable resolves when ffmpeg exits 0', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'exit') cb(0);
      }
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { ensureFfmpegAvailable } = await import('../src/utils/ffmpeg.util.js');
    await expect(ensureFfmpegAvailable()).resolves.toBeUndefined();
  });

  it('ensureFfmpegAvailable rejects on error', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'error') cb(new Error('no ffmpeg'));
      }
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { ensureFfmpegAvailable } = await import('../src/utils/ffmpeg.util.js');
    await expect(ensureFfmpegAvailable()).rejects.toThrow('no ffmpeg');
  });

  it('ensureFfmpegAvailable rejects on non-zero exit', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'exit') cb(1);
      }
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { ensureFfmpegAvailable } = await import('../src/utils/ffmpeg.util.js');
    await expect(ensureFfmpegAvailable()).rejects.toThrow('ffmpeg not available');
  });

  it('mergeWithBasmala resolves on success', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'exit') cb(0);
      },
      kill: jest.fn()
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { mergeWithBasmala } = await import('../src/utils/ffmpeg.util.js');

    const outDir = path.join(process.cwd(), 'tmp-test');
    const outputPath = path.join(outDir, 'out.mp3');
    await fs.mkdir(outDir, { recursive: true });

    await expect(
      mergeWithBasmala({
        inputPath: 'input.mp3',
        basmalaPath: 'basmala.mp3',
        outputPath,
        timeoutMs: 1000
      })
    ).resolves.toBe(outputPath);
  });

  it('mergeWithBasmala uses default timeout', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'exit') cb(0);
      },
      kill: jest.fn()
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { mergeWithBasmala } = await import('../src/utils/ffmpeg.util.js');

    const outputPath = path.join(process.cwd(), 'tmp-test', 'out-default.mp3');
    await expect(
      mergeWithBasmala({
        inputPath: 'input.mp3',
        basmalaPath: 'basmala.mp3',
        outputPath
      })
    ).resolves.toBe(outputPath);
  });

  it('mergeWithBasmala rejects on failure', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'exit') cb(1);
      },
      kill: jest.fn()
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { mergeWithBasmala } = await import('../src/utils/ffmpeg.util.js');

    await expect(
      mergeWithBasmala({
        inputPath: 'input.mp3',
        basmalaPath: 'basmala.mp3',
        outputPath: path.join(process.cwd(), 'tmp-test', 'out.mp3'),
        timeoutMs: 1000
      })
    ).rejects.toThrow('ffmpeg merge failed');
  });

  it('mergeWithBasmala times out', async () => {
    const originalSetTimeout = global.setTimeout;
    const kill = jest.fn();
    const spawn = jest.fn(() => ({
      on: () => {},
      kill
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { mergeWithBasmala } = await import('../src/utils/ffmpeg.util.js');

    global.setTimeout = (fn) => {
      fn();
      return 0;
    };

    const promise = mergeWithBasmala({
      inputPath: 'input.mp3',
      basmalaPath: 'basmala.mp3',
      outputPath: path.join(process.cwd(), 'tmp-test', 'out2.mp3'),
      timeoutMs: 10
    });

    await expect(promise).rejects.toThrow('ffmpeg timeout');
    expect(kill).toHaveBeenCalled();
    global.setTimeout = originalSetTimeout;
  });

  it('mergeWithBasmala handles process error', async () => {
    const spawn = jest.fn(() => ({
      on: (event, cb) => {
        if (event === 'error') cb(new Error('ffmpeg crash'));
      },
      kill: jest.fn()
    }));
    jest.unstable_mockModule('child_process', () => ({ spawn }));
    const { mergeWithBasmala } = await import('../src/utils/ffmpeg.util.js');

    await expect(
      mergeWithBasmala({
        inputPath: 'input.mp3',
        basmalaPath: 'basmala.mp3',
        outputPath: path.join(process.cwd(), 'tmp-test', 'out3.mp3'),
        timeoutMs: 1000
      })
    ).rejects.toThrow('ffmpeg crash');
  });
});
