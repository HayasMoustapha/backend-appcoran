import { jest } from '@jest/globals';

const mockMerge = jest.fn().mockResolvedValue('out.mp3');

jest.unstable_mockModule('../src/utils/ffmpeg.util.js', () => ({
  mergeWithBasmala: mockMerge
}));

const processor = await import('../src/modules/audio/audio.processor.js');

describe('audio.processor', () => {
  it('processBasmala returns output path', async () => {
    const out = await processor.processBasmala({
      inputPath: 'input.mp3',
      basmalaPath: 'basmala.mp3',
      outputDir: '/tmp'
    });
    expect(out).toContain('basmala');
  });
});
