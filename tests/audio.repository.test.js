import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/config/database.js', () => ({
  query: mockQuery
}));

const repo = await import('../src/modules/audio/audio.repository.js');

describe('audio.repository', () => {
  it('createAudio inserts audio', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audio = await repo.createAudio({
      id: '1',
      title: 't',
      sourate: 's',
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'f',
      basmalaAdded: false
    });
    expect(audio.id).toBe('1');
  });

  it('listAudios with sourate', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audios = await repo.listAudios({ sourate: 's' });
    expect(audios.length).toBe(1);
  });

  it('listAudios without sourate', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audios = await repo.listAudios({});
    expect(audios.length).toBe(1);
  });

  it('getAudioById returns audio', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audio = await repo.getAudioById('1');
    expect(audio.id).toBe('1');
  });

  it('getAudioById returns null when missing', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const audio = await repo.getAudioById('1');
    expect(audio).toBeNull();
  });

  it('updateAudio updates fields', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1', title: 'x' }] });
    const audio = await repo.updateAudio('1', { title: 'x' });
    expect(audio.title).toBe('x');
  });

  it('deleteAudio executes delete', async () => {
    mockQuery.mockResolvedValue({});
    await repo.deleteAudio('1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('incrementListen increments', async () => {
    mockQuery.mockResolvedValue({});
    await repo.incrementListen('1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('incrementDownload increments', async () => {
    mockQuery.mockResolvedValue({});
    await repo.incrementDownload('1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('createAudioStats inserts stats', async () => {
    mockQuery.mockResolvedValue({});
    await repo.createAudioStats('1');
    expect(mockQuery).toHaveBeenCalled();
  });
});
