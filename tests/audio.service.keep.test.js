import { jest } from '@jest/globals';

jest.resetModules();
process.env.KEEP_ORIGINAL_AUDIO = 'false';
process.env.DISABLE_DOTENV = 'true';
process.env.DATABASE_URL = 'postgresql://x';
process.env.JWT_SECRET = 'secret';
process.env.VIRUS_SCAN_AUTO = 'false';
process.env.VIRUS_SCAN_ENABLED = 'false';
process.env.AUDIO_QUEUE_ENABLED = 'true';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.AUDIO_PROCESSING_ASYNC = 'true';

const mockCreateAudio = jest.fn().mockResolvedValue({ id: '1' });
const mockCreateAudioStats = jest.fn();
const mockGetAudioBySlug = jest.fn().mockResolvedValue(null);
const mockFindDuplicateAudio = jest.fn().mockResolvedValue(null);
const mockListFavoriteAudioIds = jest.fn();
const mockToggleFavorite = jest.fn();
const mockEnqueueAudioJob = jest.fn();

jest.unstable_mockModule('../src/queue/audio.queue.js', () => ({
  enqueueAudioJob: mockEnqueueAudioJob
}));

jest.unstable_mockModule('../src/modules/audio/audio.repository.js', () => ({
  createAudio: mockCreateAudio,
  createAudioStats: mockCreateAudioStats,
  getAudioBySlug: mockGetAudioBySlug,
  findDuplicateAudio: mockFindDuplicateAudio,
  deleteAudio: jest.fn(),
  getAudioById: jest.fn(),
  incrementView: jest.fn(),
  incrementShare: jest.fn(),
  incrementDownload: jest.fn(),
  incrementListen: jest.fn(),
  listAudios: jest.fn(),
  searchAudios: jest.fn(),
  listPopular: jest.fn(),
  listTopListened: jest.fn(),
  listTopDownloaded: jest.fn(),
  listRecent: jest.fn(),
  updateAudio: jest.fn(),
  listFavoriteAudioIds: mockListFavoriteAudioIds,
  toggleFavorite: mockToggleFavorite
}));

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    unlink: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn().mockResolvedValue(
      JSON.stringify([
        {
          number: 1,
          name_fr: "L'Ouverture",
          name_phonetic: 'Al-Fatihah',
          name_ar: 'الفاتحة',
          revelation: 5,
          verses: 7,
          words: 29,
          letters: 139
        }
      ])
    )
  },
  unlink: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn().mockResolvedValue(
    JSON.stringify([
      {
        number: 1,
        name_fr: "L'Ouverture",
        name_phonetic: 'Al-Fatihah',
        name_ar: 'الفاتحة',
        revelation: 5,
        verses: 7,
        words: 29,
        letters: 139
      }
    ])
  )
}));

const service = await import('../src/modules/audio/audio.service.js');
describe('audio.service keepOriginalAudio false', () => {
  beforeEach(() => {
    mockEnqueueAudioJob.mockReset();
  });

  it('enqueues job even when keepOriginalAudio is false', async () => {
    await service.createAudioEntry({
      title: 't',
      sourate: 'الفاتحة',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: true
    });
    expect(mockEnqueueAudioJob).toHaveBeenCalled();
  });
});
