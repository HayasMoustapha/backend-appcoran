import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockList = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockStream = jest.fn();
const mockDownload = jest.fn();

jest.unstable_mockModule('../src/modules/audio/audio.service.js', () => ({
  createAudioEntry: mockCreate,
  listAllAudios: mockList,
  getAudio: mockGet,
  updateAudioMetadata: mockUpdate,
  removeAudio: mockDelete,
  streamAudio: mockStream,
  downloadAudio: mockDownload
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
});
