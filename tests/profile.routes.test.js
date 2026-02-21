import { jest } from '@jest/globals';

describe('profile.routes', () => {
  it('sets photo_url when file provided', async () => {
    jest.resetModules();

    const handlers = { post: [], put: [] };
    const Router = jest.fn(() => ({
      post: (...args) => handlers.post.push(args),
      get: jest.fn(),
      put: (...args) => handlers.put.push(args),
      delete: jest.fn()
    }));

    jest.unstable_mockModule('express', () => ({ Router }));
    jest.unstable_mockModule('fs/promises', () => ({ default: { mkdir: jest.fn() }, mkdir: jest.fn() }));
    const multerMock = Object.assign(
      () => ({ single: () => (req, res, next) => next() }),
      { diskStorage: jest.fn(() => ({})) }
    );
    jest.unstable_mockModule('multer', () => ({
      default: multerMock
    }));
    jest.unstable_mockModule('../src/modules/profile/profile.controller.js', () => ({
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      getProfile: jest.fn(),
      deleteProfile: jest.fn(),
      getPublicProfile: jest.fn()
    }));
    jest.unstable_mockModule('../src/middlewares/auth.middleware.js', () => ({ requireAuth: (req, res, next) => next() }));
    jest.unstable_mockModule('../src/middlewares/role.middleware.js', () => ({
      requireRole: () => (req, res, next) => next()
    }));
    jest.unstable_mockModule('../src/middlewares/validation.middleware.js', () => ({ validate: () => (req, res, next) => next() }));

    const routes = (await import('../src/modules/profile/profile.routes.js')).default;
    expect(typeof routes).toBe('object');

    const postHandlers = handlers.post[0];
    const putHandlers = handlers.put[0];

    const req = { body: {}, file: { path: '/tmp/p.jpg' } };
    const res = {};
    const next = jest.fn();

    // execute inline middleware that sets photo_url
    await postHandlers[4](req, res, next);
    expect(req.body.photo_url).toBe('/tmp/p.jpg');

    const req2 = { body: {}, file: { path: '/tmp/p2.jpg' } };
    await putHandlers[4](req2, res, next);
    expect(req2.body.photo_url).toBe('/tmp/p2.jpg');

    const req3 = { body: {}, file: null };
    await postHandlers[4](req3, res, next);
    expect(req3.body.photo_url).toBeUndefined();

    const req4 = { body: {}, file: null };
    await putHandlers[4](req4, res, next);
    expect(req4.body.photo_url).toBeUndefined();
  });
});
