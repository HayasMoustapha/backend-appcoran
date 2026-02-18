import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockPublic = jest.fn();

jest.unstable_mockModule('../src/modules/profile/profile.repository.js', () => ({
  createProfile: mockCreate,
  getProfileByUserId: mockGet,
  updateProfile: mockUpdate,
  deleteProfile: mockDelete,
  getPublicProfile: mockPublic
}));

const service = await import('../src/modules/profile/profile.service.js');

describe('profile.service', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockGet.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockPublic.mockReset();
  });

  it('creates profile', async () => {
    mockGet.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: '1' });
    const res = await service.createImamProfile('u1', { biography: 'b' });
    expect(res.id).toBe('1');
  });

  it('rejects duplicate profile', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    await expect(service.createImamProfile('u1', {})).rejects.toThrow('Profile already exists');
  });

  it('gets profile', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    const res = await service.getImamProfile('u1');
    expect(res.id).toBe('1');
  });

  it('rejects when profile missing', async () => {
    mockGet.mockResolvedValue(null);
    await expect(service.getImamProfile('u1')).rejects.toThrow('Profile not found');
  });

  it('updates profile', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    mockUpdate.mockResolvedValue({ id: '1', biography: 'x' });
    const res = await service.updateImamProfile('u1', { biography: 'x' });
    expect(res.biography).toBe('x');
  });

  it('rejects update when profile missing', async () => {
    mockGet.mockResolvedValue(null);
    await expect(
      service.updateImamProfile('u1', { biography: 'x' })
    ).rejects.toThrow('Profile not found');
  });

  it('rejects update when payload empty', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    await expect(service.updateImamProfile('u1', {})).rejects.toThrow('No fields to update');
  });

  it('deletes profile', async () => {
    mockGet.mockResolvedValue({ id: '1' });
    await service.removeImamProfile('u1');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('rejects delete when profile missing', async () => {
    mockGet.mockResolvedValue(null);
    await expect(service.removeImamProfile('u1')).rejects.toThrow('Profile not found');
  });

  it('gets public profile', async () => {
    mockPublic.mockResolvedValue({ biography: 'b' });
    const res = await service.getPublicImamProfile();
    expect(res.biography).toBe('b');
  });

  it('rejects when public profile missing', async () => {
    mockPublic.mockResolvedValue(null);
    await expect(service.getPublicImamProfile()).rejects.toThrow('Profile not found');
  });
});
