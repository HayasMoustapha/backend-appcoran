import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/env.js', () => ({
  default: {
    uploadDir: './uploads',
    port: 4000,
    ffmpegRequired: false,
    autoMigrate: false,
    autoSeed: false
  }
}));

jest.unstable_mockModule('../src/utils/ffmpeg.util.js', () => ({
  ensureFfmpegAvailable: jest.fn().mockResolvedValue(),
  ensureFfprobeAvailable: jest.fn().mockResolvedValue()
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
  default: { listen: jest.fn((port, cb) => cb && cb()) }
}));

jest.unstable_mockModule('../src/config/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

const server = await import('../src/server.js');

describe('server without auto migrate/seed', () => {
  it('starts server', async () => {
    await server.start();
  });
});
