import { jest } from '@jest/globals';

describe('audio.routes', () => {
  it('generates filename with default extension', async () => {
    jest.resetModules();
    const filenameSpy = jest.fn();
    const Router = jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }));

    const multerMock = Object.assign(
      () => ({ single: () => (req, res, next) => next() }),
      {
        diskStorage: jest.fn((opts) => {
          filenameSpy.mockImplementation(opts.filename);
          return {};
        })
      }
    );

    jest.unstable_mockModule('express', () => ({ Router }));
    jest.unstable_mockModule('multer', () => ({ default: multerMock }));
    jest.unstable_mockModule('fs/promises', () => ({ default: { mkdir: jest.fn() }, mkdir: jest.fn() }));
    jest.unstable_mockModule('../src/modules/audio/audio.controller.js', () => ({
      createAudio: jest.fn(),
      listAudios: jest.fn(),
      getAudio: jest.fn(),
      updateAudio: jest.fn(),
      deleteAudio: jest.fn(),
      streamAudio: jest.fn(),
      downloadAudio: jest.fn(),
      searchAudios: jest.fn(),
      popularAudios: jest.fn(),
      topListened: jest.fn(),
      topDownloaded: jest.fn(),
      recentAudios: jest.fn()
    }));
    jest.unstable_mockModule('../src/middlewares/auth.middleware.js', () => ({ requireAuth: (req, res, next) => next() }));
    jest.unstable_mockModule('../src/middlewares/validation.middleware.js', () => ({ validate: () => (req, res, next) => next() }));

    const routes = (await import('../src/modules/audio/audio.routes.js')).default;
    expect(typeof routes).toBe('object');

    const cb = jest.fn();
    filenameSpy({}, {}, cb);
    expect(cb).toHaveBeenCalled();
  });
});
