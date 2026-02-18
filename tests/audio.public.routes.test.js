import { jest } from '@jest/globals';

describe('audio.public.routes', () => {
  it('registers public audio route', async () => {
    jest.resetModules();
    const Router = jest.fn(() => ({ get: jest.fn() }));
    jest.unstable_mockModule('express', () => ({ Router }));
    jest.unstable_mockModule('../src/modules/audio/audio.controller.js', () => ({ getPublicAudio: jest.fn() }));

    const routes = (await import('../src/modules/audio/audio.public.routes.js')).default;
    expect(typeof routes).toBe('object');
  });
});
