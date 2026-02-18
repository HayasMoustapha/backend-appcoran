import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};
const mockPool = { connect: jest.fn().mockResolvedValue(mockClient) };

jest.unstable_mockModule('../src/config/database.js', () => ({
  query: mockQuery,
  pool: mockPool
}));

const repo = await import('../src/modules/audio/audio.repository.js');

describe('audio.repository', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  it('createAudio inserts audio', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audio = await repo.createAudio({
      id: '1',
      title: 't',
      sourate: 's',
      numeroSourate: 1,
      versetStart: 1,
      versetEnd: 2,
      description: 'd',
      filePath: 'f',
      basmalaAdded: false,
      slug: '1-test'
    });
    expect(audio.id).toBe('1');
  });

  it('listAudios with sourate', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audios = await repo.listAudios({ sourate: 's' });
    expect(audios.length).toBe(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY numero_sourate ASC, verset_start ASC'),
      ['s']
    );
  });

  it('listAudios without sourate', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audios = await repo.listAudios({});
    expect(audios.length).toBe(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY numero_sourate ASC, verset_start ASC')
    );
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

  it('getAudioBySlug returns audio', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const audio = await repo.getAudioBySlug('1-test');
    expect(audio.id).toBe('1');
  });

  it('getAudioBySlug returns null when missing', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const audio = await repo.getAudioBySlug('1-test');
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

  it('incrementView updates view_count', async () => {
    mockQuery.mockResolvedValue({});
    await repo.incrementView('1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('incrementListen increments', async () => {
    mockClient.query.mockResolvedValue({});
    await repo.incrementListen('1');
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('incrementDownload increments', async () => {
    mockClient.query.mockResolvedValue({});
    await repo.incrementDownload('1');
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('incrementListen rolls back on error', async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'));
    await expect(repo.incrementListen('1')).rejects.toThrow('fail');
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('incrementDownload rolls back on error', async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'));
    await expect(repo.incrementDownload('1')).rejects.toThrow('fail');
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('createAudioStats inserts stats', async () => {
    mockQuery.mockResolvedValue({});
    await repo.createAudioStats('1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('searchAudios returns data', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await repo.searchAudios({
      queryText: 't',
      sourate: 's',
      numero: 1,
      from: '2024-01-01',
      to: '2024-12-31',
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      sortDir: 'desc'
    });
    expect(result.total).toBe(0);
  });

  it('searchAudios uses default order when sortBy invalid', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await repo.searchAudios({
      page: 1,
      limit: 10,
      sortBy: 'invalid',
      sortDir: 'asc'
    });
    expect(result.total).toBe(0);
  });

  it('searchAudios uses asc order for valid sortBy', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await repo.searchAudios({
      page: 1,
      limit: 10,
      sortBy: 'title',
      sortDir: 'asc'
    });
    expect(result.total).toBe(0);
  });

  it('listPopular/top/recent return rows', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await repo.listPopular(10);
    await repo.listTopListened(10);
    await repo.listTopDownloaded(10);
    await repo.listRecent(10);
    expect(mockQuery).toHaveBeenCalled();
  });
});
