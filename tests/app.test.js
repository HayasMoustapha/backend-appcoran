import { jest } from '@jest/globals';

describe('app', () => {
  it('registers health route', async () => {
    jest.resetModules();
    const handlers = {};

    const app = {
      use: jest.fn(),
      get: jest.fn((path, handler) => {
        handlers[path] = handler;
      })
    };

    const expressMock = jest.fn(() => app);
    expressMock.json = jest.fn(() => (req, res, next) => next());

    jest.unstable_mockModule('express', () => ({ default: expressMock }));
    jest.unstable_mockModule('helmet', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('cors', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('express-rate-limit', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('pino-http', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('swagger-ui-express', () => ({
      default: { serve: (req, res, next) => next(), setup: () => (req, res, next) => next() }
    }));
    jest.unstable_mockModule('../src/docs/swagger.js', () => ({ default: {} }));
    jest.unstable_mockModule('../src/modules/auth/auth.routes.js', () => ({ default: jest.fn() }));
    jest.unstable_mockModule('../src/modules/audio/audio.routes.js', () => ({ default: jest.fn() }));

    await import('../src/app.js');

    const res = { json: jest.fn() };
    handlers['/health']({}, res);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
