import { jest } from '@jest/globals';

describe('routes', () => {
  it('exports routers and covers filename generator', async () => {
    jest.resetModules();
    const filenameSpy = jest.fn();

    const multerMock = jest.fn(() => ({
      single: jest.fn(() => (req, res, next) => next())
    }));
    multerMock.diskStorage = jest.fn((opts) => {
      filenameSpy.mockImplementation(opts.filename);
      return {};
    });

    jest.unstable_mockModule('multer', () => ({ default: multerMock }));
    jest.unstable_mockModule('fs/promises', () => ({
      default: { mkdir: jest.fn().mockResolvedValue() },
      mkdir: jest.fn().mockResolvedValue()
    }));

    const authRoutes = (await import('../src/modules/auth/auth.routes.js')).default;
    const audioRoutes = (await import('../src/modules/audio/audio.routes.js')).default;
    const profileRoutes = (await import('../src/modules/profile/profile.routes.js')).default;
    const dashboardRoutes = (await import('../src/modules/dashboard/dashboard.routes.js')).default;

    const file = { originalname: 'test.mp3' };
    const cb = jest.fn();
    filenameSpy({}, file, cb);
    const cb2 = jest.fn();
    filenameSpy({}, {}, cb2);
    expect(cb).toHaveBeenCalled();
    expect(typeof authRoutes).toBe('function');
    expect(typeof audioRoutes).toBe('function');
    expect(typeof profileRoutes).toBe('function');
    expect(typeof dashboardRoutes).toBe('function');
  });
});
