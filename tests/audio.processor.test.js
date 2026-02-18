import { jest } from '@jest/globals';

const mockMerge = jest.fn().mockResolvedValue('out.mp3');
const mockProbe = jest.fn();
const mockExtract = jest.fn().mockResolvedValue('out.m4a');
const mockTranscode = jest.fn().mockResolvedValue('out.mp3');

jest.unstable_mockModule('fs/promises', () => ({
  default: { access: jest.fn().mockResolvedValue() },
  access: jest.fn().mockResolvedValue()
}));

jest.unstable_mockModule('../src/utils/ffmpeg.util.js', () => ({
  mergeWithBasmala: mockMerge,
  probeMedia: mockProbe,
  extractAudio: mockExtract,
  transcodeToMp3: mockTranscode
}));

const processor = await import('../src/modules/audio/audio.processor.js');

describe('audio.processor', () => {
  it('processBasmala returns output path', async () => {
    const out = await processor.processBasmala({
      inputPath: 'input.mp3',
      basmalaPath: 'basmala.mp3',
      outputDir: '/tmp',
      ffmpegPath: 'ffmpeg'
    });
    expect(out).toContain('basmala');
  });

  it('prepareAudioFile keeps audio-only files', async () => {
    mockProbe.mockResolvedValueOnce({
      streams: [{ codec_type: 'audio', codec_name: 'mp3' }]
    });
    const out = await processor.prepareAudioFile({
      inputPath: 'input.mp3',
      outputDir: '/tmp',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe'
    });
    expect(out.audioPath).toBe('input.mp3');
    expect(out.extracted).toBe(false);
  });

  it('prepareAudioFile extracts audio from video', async () => {
    mockProbe.mockResolvedValueOnce({
      streams: [
        { codec_type: 'video', codec_name: 'h264' },
        { codec_type: 'audio', codec_name: 'aac' }
      ]
    });
    mockProbe.mockResolvedValueOnce({
      streams: [{ codec_type: 'audio', codec_name: 'aac' }]
    });
    const out = await processor.prepareAudioFile({
      inputPath: 'input.mp4',
      outputDir: '/tmp',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe'
    });
    expect(out.extracted).toBe(true);
  });

  it('prepareAudioFile falls back to mp3 when extracted audio is missing', async () => {
    mockProbe
      .mockResolvedValueOnce({
        streams: [
          { codec_type: 'video', codec_name: 'h264' },
          { codec_type: 'audio', codec_name: 'aac' }
        ]
      })
      .mockResolvedValueOnce({ streams: [] })
      .mockResolvedValueOnce({ streams: [{ codec_type: 'audio', codec_name: 'mp3' }] });
    const out = await processor.prepareAudioFile({
      inputPath: 'input.mp4',
      outputDir: '/tmp',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe'
    });
    expect(out.audioPath).toContain('.mp3');
  });
});
