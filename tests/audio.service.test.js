import { jest } from '@jest/globals';

const mockProcessBasmala = jest.fn();
const mockCreateAudio = jest.fn();
const mockCreateAudioStats = jest.fn();
const mockDeleteAudio = jest.fn();
const mockGetAudioById = jest.fn();
const mockIncrementDownload = jest.fn();
const mockIncrementListen = jest.fn();
const mockListAudios = jest.fn();
const mockUpdateAudio = jest.fn();

jest.unstable_mockModule('../src/modules/audio/audio.processor.js', () => ({
  processBasmala: mockProcessBasmala
}));

jest.unstable_mockModule('../src/modules/audio/audio.repository.js', () => ({
  createAudio: mockCreateAudio,
  createAudioStats: mockCreateAudioStats,
  deleteAudio: mockDeleteAudio,
  getAudioById: mockGetAudioById,
  incrementDownload: mockIncrementDownload,
  incrementListen: mockIncrementListen,
  listAudios: mockListAudios,
  updateAudio: mockUpdateAudio
}));

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    unlink: jest.fn(),
    stat: jest.fn()
  },
  unlink: jest.fn(),
  stat: jest.fn()
}));

const service = await import('../src/modules/audio/audio.service.js');
const fsPromises = (await import('fs/promises')).default;

describe('audio.service', () => {
  beforeEach(() => {
    mockProcessBasmala.mockReset();
    mockCreateAudio.mockReset();
    mockCreateAudioStats.mockReset();
    mockDeleteAudio.mockReset();
    mockGetAudioById.mockReset();
    mockIncrementDownload.mockReset();
    mockIncrementListen.mockReset();
    mockListAudios.mockReset();
    mockUpdateAudio.mockReset();
    fsPromises.unlink.mockReset();
  });

  it('creates audio without basmala', async () => {
    mockCreateAudio.mockResolvedValue({ id: '1' });
    const audio = await service.createAudioEntry({
      title: 't',
      sourate: 's',
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
    mockProcessBasmala.mockResolvedValue('merged.mp3');
    mockCreateAudio.mockResolvedValue({ id: '1' });
    await service.createAudioEntry({
      title: 't',
      sourate: 's',
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'file.mp3',
      addBasmala: true
    });
    expect(mockProcessBasmala).toHaveBeenCalled();
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

  it('throws when audio not found', async () => {
    mockGetAudioById.mockResolvedValue(null);
    await expect(service.getAudio('1')).rejects.toThrow('Audio not found');
  });

  it('updates audio metadata', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1' });
    mockUpdateAudio.mockResolvedValue({ id: '1', title: 'x' });
    const audio = await service.updateAudioMetadata('1', { title: 'x' });
    expect(audio.title).toBe('x');
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
    const res = { setHeader: jest.fn(), sendFile: jest.fn() };
    await service.streamAudio(res, '1');
    expect(res.sendFile).toHaveBeenCalled();
    expect(mockIncrementListen).toHaveBeenCalled();
  });

  it('downloads audio', async () => {
    mockGetAudioById.mockResolvedValue({ id: '1', file_path: 'file.mp3' });
    const res = { download: jest.fn() };
    await service.downloadAudio(res, '1');
    expect(mockIncrementDownload).toHaveBeenCalled();
  });
});
