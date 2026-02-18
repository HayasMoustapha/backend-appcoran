import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/config/database.js', () => ({
  query: mockQuery
}));

const repo = await import('../src/modules/profile/profile.repository.js');

describe('profile.repository', () => {
  it('createProfile inserts', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const res = await repo.createProfile({ userId: 'u1', biography: 'b', parcours: 'p', statut: 's', photoUrl: 'x' });
    expect(res.id).toBe('1');
  });

  it('getProfileByUserId returns null', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await repo.getProfileByUserId('u1');
    expect(res).toBeNull();
  });

  it('updateProfile updates', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const res = await repo.updateProfile('u1', { biography: 'x' });
    expect(res.id).toBe('1');
  });

  it('deleteProfile deletes', async () => {
    mockQuery.mockResolvedValue({});
    await repo.deleteProfile('u1');
    expect(mockQuery).toHaveBeenCalled();
  });

  it('getPublicProfile returns row', async () => {
    mockQuery.mockResolvedValue({ rows: [{ biography: 'b' }] });
    const res = await repo.getPublicProfile();
    expect(res.biography).toBe('b');
  });

  it('getPublicProfile returns null when empty', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await repo.getPublicProfile();
    expect(res).toBeNull();
  });
});
