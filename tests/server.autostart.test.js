import { jest } from '@jest/globals';

describe('server auto-start', () => {
  it('logs and exits on start failure', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    const logger = { info: jest.fn(), error: jest.fn() };

    jest.unstable_mockModule('../src/config/env.js', () => ({
      default: {
        uploadDir: './uploads',
        port: 4000,
        autoMigrate: true,
        autoSeed: true
      }
    }));

    jest.unstable_mockModule('../src/config/logger.js', () => ({ default: logger }));

    jest.unstable_mockModule('../src/utils/ffmpeg.util.js', () => ({
      ensureFfmpegAvailable: jest.fn().mockRejectedValue(new Error('ffmpeg missing')),
      ensureFfprobeAvailable: jest.fn()
    }));

    jest.unstable_mockModule('../src/config/migrations.js', () => ({
      ensureDatabaseExists: jest.fn().mockResolvedValue(),
      runMigrations: jest.fn().mockResolvedValue()
    }));

    jest.unstable_mockModule('../src/config/seeds.js', () => ({
      seedAdmin: jest.fn().mockResolvedValue()
    }));

    jest.unstable_mockModule('fs/promises', () => ({
      default: { mkdir: jest.fn().mockResolvedValue() },
      mkdir: jest.fn().mockResolvedValue()
    }));

    jest.unstable_mockModule('../src/app.js', () => ({
      default: { listen: jest.fn() }
    }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await import('../src/server.js');

    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
