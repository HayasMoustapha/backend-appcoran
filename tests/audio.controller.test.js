import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockList = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockStream = jest.fn();
const mockDownload = jest.fn();
const mockSearch = jest.fn();
const mockPopular = jest.fn();
const mockTopListened = jest.fn();
const mockTopDownloaded = jest.fn();
const mockRecent = jest.fn();
const mockPublic = jest.fn();

jest.unstable_mockModule('../src/modules/audio/audio.service.js', () => ({
  createAudioEntry: mockCreate,
  listAllAudios: mockList,
  getAudioWithViewIncrement: mockGet,
  getPublicAudioBySlug: mockPublic,
  updateAudioMetadata: mockUpdate,
  removeAudio: mockDelete,
  streamAudio: mockStream,
  downloadAudio: mockDownload,
  searchAudio: mockSearch,
  getPopular: mockPopular,
  getTopListened: mockTopListened,
  getTopDownloaded: mockTopDownloaded,
  getRecent: mockRecent
}));

const controller = await import('../src/modules/audio/audio.controller.js');

describe('audio.controller', () => {
  it('createAudio validates file', async () => {
    const next = jest.fn();
    await controller.createAudio({ body: {}, file: null }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('createAudio responds', async () => {
    mockCreate.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.createAudio({ body: {}, file: { path: 'file.mp3' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createAudio passes errors to next', async () => {
    mockCreate.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.createAudio({ body: {}, file: { path: 'file.mp3' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('listAudios responds', async () => {
    mockList.mockResolvedValue([{ id: '1' }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.listAudios({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('listAudios passes errors to next', async () => {
    mockList.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.listAudios({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('getAudio responds', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getAudio({ params: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getAudio passes errors to next', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.getAudio({ params: { id: '1' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateAudio responds', async () => {
    mockUpdate.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.updateAudio({ params: { id: '1' }, body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateAudio passes errors to next', async () => {
    mockUpdate.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.updateAudio({ params: { id: '1' }, body: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('deleteAudio responds', async () => {
    mockDelete.mockResolvedValue();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.deleteAudio({ params: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteAudio passes errors to next', async () => {
    mockDelete.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.deleteAudio({ params: { id: '1' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('streamAudio calls service', async () => {
    const res = {};
    await controller.streamAudio({ params: { id: '1' }, headers: {} }, res, jest.fn());
    expect(mockStream).toHaveBeenCalled();
  });

  it('streamAudio passes errors to next', async () => {
    mockStream.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.streamAudio({ params: { id: '1' }, headers: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('downloadAudio calls service', async () => {
    const res = {};
    await controller.downloadAudio({ params: { id: '1' } }, res, jest.fn());
    expect(mockDownload).toHaveBeenCalled();
  });

  it('downloadAudio passes errors to next', async () => {
    mockDownload.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.downloadAudio({ params: { id: '1' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('searchAudios responds', async () => {
    mockSearch.mockResolvedValue({ total: 0, data: [] });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.searchAudios({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searchAudios with numero', async () => {
    mockSearch.mockResolvedValue({ total: 0, data: [] });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.searchAudios({ query: { numero: '2' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searchAudios passes errors to next', async () => {
    mockSearch.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.searchAudios({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('popularAudios responds', async () => {
    mockPopular.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.popularAudios({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('popularAudios passes errors to next', async () => {
    mockPopular.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.popularAudios({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('topListened responds', async () => {
    mockTopListened.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.topListened({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('topListened passes errors to next', async () => {
    mockTopListened.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.topListened({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('topDownloaded responds', async () => {
    mockTopDownloaded.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.topDownloaded({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('topDownloaded passes errors to next', async () => {
    mockTopDownloaded.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.topDownloaded({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('recentAudios responds', async () => {
    mockRecent.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.recentAudios({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('recentAudios passes errors to next', async () => {
    mockRecent.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.recentAudios({ query: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('getPublicAudio responds', async () => {
    mockPublic.mockResolvedValue({
      title: 't',
      sourate: 's',
      numero_sourate: 1,
      verset_start: 1,
      verset_end: 2,
      description: 'd',
      slug: '1-test',
      view_count: 0,
      listen_count: 0,
      download_count: 0,
      created_at: 'now'
    });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getPublicAudio({ params: { slug: '1-test' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPublicAudio passes errors to next', async () => {
    mockPublic.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.getPublicAudio({ params: { slug: '1-test' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
