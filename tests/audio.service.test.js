import { jest } from '@jest/globals';

const mockProcessBasmala = jest.fn();
const mockPrepareAudioFile = jest.fn();
const mockCreateAudio = jest.fn();
const mockCreateAudioStats = jest.fn();
const mockDeleteAudio = jest.fn();
const mockGetAudioById = jest.fn();
const mockGetAudioBySlug = jest.fn();
const mockIncrementDownload = jest.fn();
const mockIncrementListen = jest.fn();
const mockListAudios = jest.fn();
const mockUpdateAudio = jest.fn();
const mockIncrementView = jest.fn();
const mockIncrementShare = jest.fn();
const mockSearchAudios = jest.fn();
const mockListPopular = jest.fn();
const mockListTopListened = jest.fn();
const mockListTopDownloaded = jest.fn();
const mockListRecent = jest.fn();
const mockFindDuplicateAudio = jest.fn();

jest.unstable_mockModule('../src/config/env.js', () => ({
  default: {
    basmalaPath: './assets/default/basmala_default.mp3',
    uploadDir: './uploads',
    keepOriginalAudio: true,
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
    ffmpegRequired: false
  }
}));

jest.unstable_mockModule('../src/modules/audio/audio.processor.js', () => ({
  processBasmala: mockProcessBasmala,
  prepareAudioFile: mockPrepareAudioFile
}));

jest.unstable_mockModule('../src/modules/audio/audio.repository.js', () => ({
  createAudio: mockCreateAudio,
  createAudioStats: mockCreateAudioStats,
  deleteAudio: mockDeleteAudio,
  getAudioById: mockGetAudioById,
  getAudioBySlug: mockGetAudioBySlug,
  findDuplicateAudio: mockFindDuplicateAudio,
  incrementView: mockIncrementView,
  incrementShare: mockIncrementShare,
  incrementDownload: mockIncrementDownload,
  incrementListen: mockIncrementListen,
  listAudios: mockListAudios,
  searchAudios: mockSearchAudios,
  listPopular: mockListPopular,
  listTopListened: mockListTopListened,
  listTopDownloaded: mockListTopDownloaded,
  listRecent: mockListRecent,
  updateAudio: mockUpdateAudio
}));

jest.unstable_mockModule('../src/modules/profile/profile.repository.js', () => ({
  getPublicProfile: jest.fn().mockResolvedValue({ name: 'Imam Test' })
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
        },
        {
          number: 2,
          name_fr: 'La Vache',
          name_phonetic: 'Al-Baqarah',
          name_ar: 'البقرة',
          revelation: 87,
          verses: 286,
          words: 6121,
          letters: 25632
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
      },
      {
        number: 2,
        name_fr: 'La Vache',
        name_phonetic: 'Al-Baqarah',
        name_ar: 'البقرة',
        revelation: 87,
        verses: 286,
        words: 6121,
        letters: 25632
      }
    ])
  )
}));

jest.unstable_mockModule('fs', () => ({
  createReadStream: jest.fn(() => ({ pipe: jest.fn() }))
}));

const service = await import('../src/modules/audio/audio.service.js');
const fsPromises = (await import('fs/promises')).default;

describe('audio.service', () => {
  beforeEach(() => {
    mockProcessBasmala.mockReset();
    mockPrepareAudioFile.mockReset();
    mockCreateAudio.mockReset();
    mockCreateAudioStats.mockReset();
    mockDeleteAudio.mockReset();
    mockGetAudioById.mockReset();
    mockGetAudioBySlug.mockReset();
    mockIncrementView.mockReset();
    mockSearchAudios.mockReset();
    mockListPopular.mockReset();
    mockListTopListened.mockReset();
    mockListTopDownloaded.mockReset();
    mockListRecent.mockReset();
    mockFindDuplicateAudio.mockReset();
    mockIncrementDownload.mockReset();
    mockIncrementListen.mockReset();
    mockIncrementShare.mockReset();
    mockListAudios.mockReset();
    mockUpdateAudio.mockReset();
    fsPromises.unlink.mockReset();
  });

  it('creates audio without basmala', async () => {
    mockPrepareAudioFile.mockResolvedValue({ audioPath: 'file.mp3', extracted: false });
    mockCreateAudio.mockResolvedValue({ id: '1' });
    mockGetAudioBySlug.mockResolvedValueOnce({ id: 'x' }).mockResolvedValueOnce(null);
    const audio = await service.createAudioEntry({
      title: 't',
      sourate: 'الفاتحة',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: false
    });
    expect(audio.id).toBe('1');
    expect(mockCreateAudioStats).toHaveBeenCalled();
  });

  it('creates audio with basmala and cleanup', async () => {
    mockPrepareAudioFile.mockResolvedValue({ audioPath: 'file.mp3', extracted: false });
    mockProcessBasmala.mockResolvedValue('merged.mp3');
    mockCreateAudio.mockResolvedValue({ id: '1' });
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
    expect(mockProcessBasmala).toHaveBeenCalled();
  });

  it('falls back when ffprobe is missing and ffmpeg is optional', async () => {
    mockPrepareAudioFile.mockRejectedValueOnce(new Error('ffprobe not available'));
    mockCreateAudio.mockResolvedValue({ id: '1' });
    mockGetAudioBySlug.mockResolvedValueOnce({ id: 'x' }).mockResolvedValueOnce(null);
    const audio = await service.createAudioEntry({
      title: 't',
      sourate: 'الفاتحة',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: false
    });
    expect(audio.id).toBe('1');
  });

  it('falls back when ffmpeg is missing and ffmpeg is optional', async () => {
    mockPrepareAudioFile.mockRejectedValueOnce(new Error('spawn ffmpeg ENOENT'));
    mockCreateAudio.mockResolvedValue({ id: '1' });
    mockGetAudioBySlug.mockResolvedValueOnce({ id: 'x' }).mockResolvedValueOnce(null);
    const audio = await service.createAudioEntry({
      title: 't',
      sourate: 'الفاتحة',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: false
    });
    expect(audio.id).toBe('1');
  });

  it('falls back when no audio stream is found and ffmpeg is optional', async () => {
    mockPrepareAudioFile.mockRejectedValueOnce(new Error('No audio stream found'));
    mockCreateAudio.mockResolvedValue({ id: '1' });
    mockGetAudioBySlug.mockResolvedValueOnce({ id: 'x' }).mockResolvedValueOnce(null);
    const audio = await service.createAudioEntry({
      title: 't',
      sourate: 'الفاتحة',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: false
    });
    expect(audio.id).toBe('1');
  });

  it('lists audios', async () => {
    mockListAudios.mockResolvedValue([{ id: '1' }]);
    const audios = await service.listAllAudios({});
    expect(audios.length).toBe(1);
  });

  it('gets audio', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1' });
    const audio = await service.getAudio('1');
    expect(audio.id).toBe('1');
  });

  it('gets audio and increments view', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1' });
    await service.getAudioWithViewIncrement('1');
    expect(mockIncrementView).toHaveBeenCalled();
  });

  it('gets public audio by slug', async () => {
    mockGetAudioBySlug.mockResolvedValue({ id: '1' });
    const audio = await service.getPublicAudioBySlug('1-test');
    expect(audio.id).toBe('1');
  });

  it('gets public audio and increments view', async () => {
    mockGetAudioBySlug.mockResolvedValue({ id: '1' });
    await service.getPublicAudioWithViewIncrement('1-test');
    expect(mockIncrementView).toHaveBeenCalled();
  });

  it('shares public audio and increments share', async () => {
    mockGetAudioBySlug.mockResolvedValue({ id: '1' });
    await service.sharePublicAudio('1-test');
    expect(mockIncrementShare).toHaveBeenCalled();
  });

  it('rejects when public audio not found', async () => {
    mockGetAudioBySlug.mockResolvedValue(null);
    await expect(service.getPublicAudioBySlug('missing')).rejects.toThrow('Audio not found');
  });

  it('throws when audio not found', async () => {
    mockGetAudioById.mockResolvedValue(null);
    await expect(service.getAudio('1')).rejects.toThrow('Audio not found');
  });

  it('updates audio metadata', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', numero_sourate: 1, title: 't' });
    mockGetAudioBySlug.mockResolvedValue({ id: '1' });
    mockUpdateAudio.mockResolvedValue({ id: '1', title: 'x' });
    const audio = await service.updateAudioMetadata('1', { title: 'x' });
    expect(audio.title).toBe('x');
  });

  it('updates metadata without slug change', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', numero_sourate: 1, title: 't' });
    mockUpdateAudio.mockResolvedValue({ id: '1', description: 'd' });
    const audio = await service.updateAudioMetadata('1', { description: 'd' });
    expect(audio.description).toBe('d');
  });

  it('updates slug when numero_sourate changes', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', numero_sourate: 1, title: 't' });
    mockGetAudioBySlug.mockResolvedValue({ id: '1' });
    mockUpdateAudio.mockResolvedValue({ id: '1', numero_sourate: 2 });
    const audio = await service.updateAudioMetadata('1', { numeroSourate: 2 });
    expect(audio.numero_sourate).toBe(2);
  });

  it('rejects update when audio missing', async () => {
    mockGetAudioById.mockResolvedValue(null);
    await expect(
      service.updateAudioMetadata('1', { title: 'x' })
    ).rejects.toThrow('Audio not found');
  });

  it('rejects empty update', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1' });
    await expect(service.updateAudioMetadata('1', {})).rejects.toThrow('No fields to update');
  });

  it('removes audio', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    await service.removeAudio('1');
    expect(mockDeleteAudio).toHaveBeenCalled();
  });

  it('rejects remove when audio missing', async () => {
    mockGetAudioById.mockResolvedValue(null);
    await expect(service.removeAudio('1')).rejects.toThrow('Audio not found');
  });

  it('ignores unlink errors on remove', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    fsPromises.unlink.mockRejectedValueOnce(new Error('missing'));
    await service.removeAudio('1');
    expect(mockDeleteAudio).toHaveBeenCalled();
  });

  it('streams audio', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { setHeader: jest.fn(), writeHead: jest.fn() };
    fsPromises.stat.mockResolvedValue({ size: 10 });
    await service.streamAudio(res, '1');
    expect(res.writeHead).toHaveBeenCalled();
    expect(mockIncrementListen).toHaveBeenCalled();
  });

  it('streams public audio by slug', async () => {
    mockGetAudioBySlug.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { setHeader: jest.fn(), writeHead: jest.fn() };
    fsPromises.stat.mockResolvedValue({ size: 10 });
    await service.streamPublicAudio(res, 'slug');
    expect(res.writeHead).toHaveBeenCalled();
    expect(mockIncrementListen).toHaveBeenCalled();
  });

  it('streams audio with range', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { setHeader: jest.fn(), writeHead: jest.fn() };
    fsPromises.stat.mockResolvedValue({ size: 10 });
    await service.streamAudio(res, '1', 'bytes=0-4');
    expect(res.writeHead).toHaveBeenCalledWith(206, expect.any(Object));
  });

  it('streams audio with open-ended range', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { setHeader: jest.fn(), writeHead: jest.fn() };
    fsPromises.stat.mockResolvedValue({ size: 10 });
    await service.streamAudio(res, '1', 'bytes=0-');
    expect(res.writeHead).toHaveBeenCalledWith(206, expect.any(Object));
  });

  it('downloads audio', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { download: jest.fn() };
    await service.downloadAudio(res, '1');
    expect(mockIncrementDownload).toHaveBeenCalled();
  });

  it('downloads public audio by slug', async () => {
    mockGetAudioBySlug.mockResolvedValue({ id: '1', file_path: 'file.mp3', slug: 'test' });
    const res = { download: jest.fn() };
    await service.downloadPublicAudio(res, 'slug');
    expect(mockIncrementDownload).toHaveBeenCalled();
  });

  it('searches audios', async () => {
    mockSearchAudios.mockResolvedValue({ total: 0, data: [] });
    const result = await service.searchAudio({ page: 1, limit: 10 });
    expect(result.total).toBe(0);
  });

  it('ranking endpoints', async () => {
    mockListPopular.mockResolvedValue([]);
    mockListTopListened.mockResolvedValue([]);
    mockListTopDownloaded.mockResolvedValue([]);
    mockListRecent.mockResolvedValue([]);
    await service.getPopular(10);
    await service.getTopListened(10);
    await service.getTopDownloaded(10);
    await service.getRecent(10);
  });
});
