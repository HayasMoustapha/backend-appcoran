import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockPublic = jest.fn();

jest.unstable_mockModule('../src/modules/profile/profile.service.js', () => ({
  createImamProfile: mockCreate,
  getImamProfile: mockGet,
  updateImamProfile: mockUpdate,
  removeImamProfile: mockDelete,
  getPublicImamProfile: mockPublic
}));

const controller = await import('../src/modules/profile/profile.controller.js');

describe('profile.controller', () => {
  it('createProfile responds', async () => {
    mockCreate.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.createProfile({ user: { id: 'u1' }, body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createProfile passes errors to next', async () => {
    mockCreate.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.createProfile({ user: { id: 'u1' }, body: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('getProfile responds', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getProfile({ user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getProfile passes errors to next', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.getProfile({ user: { id: 'u1' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('updateProfile responds', async () => {
    mockUpdate.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.updateProfile({ user: { id: 'u1' }, body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateProfile passes errors to next', async () => {
    mockUpdate.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.updateProfile({ user: { id: 'u1' }, body: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('deleteProfile responds', async () => {
    mockDelete.mockResolvedValue();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.deleteProfile({ user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteProfile passes errors to next', async () => {
    mockDelete.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.deleteProfile({ user: { id: 'u1' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('getPublicProfile responds', async () => {
    mockPublic.mockResolvedValue({ biography: 'b' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getPublicProfile({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPublicProfile passes errors to next', async () => {
    mockPublic.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.getPublicProfile({}, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
