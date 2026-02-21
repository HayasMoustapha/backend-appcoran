import { jest } from '@jest/globals';

describe('app', () => {
  it('registers health route', async () => {
    jest.resetModules();
    const handlers = {};
    let notFoundHandler;

    const app = {
      use: jest.fn((arg1, arg2) => {
        const handler = typeof arg1 === 'function' ? arg1 : arg2;
        if (handler && handler.length === 2 && !notFoundHandler) {
          notFoundHandler = handler;
        }
      }),
      get: jest.fn((path, handler) => {
        handlers[path] = handler;
      }),
      post: jest.fn()
    };

    const expressMock = jest.fn(() => app);
    const Router = jest.fn(() => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));
    expressMock.json = jest.fn(() => (req, res, next) => next());

    jest.unstable_mockModule('express', () => ({ default: expressMock, Router }));
    jest.unstable_mockModule('helmet', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('cors', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('express-rate-limit', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('pino-http', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('swagger-ui-express', () => ({
      default: { serve: (req, res, next) => next(), setup: () => (req, res, next) => next() }
    }));
    jest.unstable_mockModule('../src/utils/ffmpeg.util.js', () => ({
      ensureFfmpegAvailable: jest.fn().mockResolvedValue(),
      ensureFfprobeAvailable: jest.fn().mockResolvedValue()
    }));
    jest.unstable_mockModule('../src/docs/swagger.js', () => ({ default: {} }));
    jest.unstable_mockModule('../src/modules/auth/auth.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/audio/audio.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/audio/audio.public.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/profile/profile.public.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/profile/profile.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/dashboard/dashboard.routes.js', () => ({ default: jest.fn() }));

    await import('../src/app.js');

    const res = { json: jest.fn() };
    handlers['/health']({}, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });

    const ffmpegRes = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await handlers['/health/ffmpeg']({}, ffmpegRes);
    expect(ffmpegRes.json).toHaveBeenCalled();

    const notFoundRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    notFoundHandler({}, notFoundRes);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
  });
});
