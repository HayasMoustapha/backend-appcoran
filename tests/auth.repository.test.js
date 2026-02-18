import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/config/database.js', () => ({
  query: mockQuery
}));

const repo = await import('../src/modules/auth/auth.repository.js');

describe('auth.repository', () => {
  it('findUserByEmail returns user', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });
    const user = await repo.findUserByEmail('a@b.com');
    expect(user.id).toBe('1');
  });

  it('findUserByEmail returns null when missing', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const user = await repo.findUserByEmail('a@b.com');
    expect(user).toBeNull();
  });

  it('createUser inserts user', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: '1', email: 'a@b.com' }] });
    const user = await repo.createUser({ id: '1', email: 'a@b.com', passwordHash: 'h', role: 'admin' });
    expect(user.email).toBe('a@b.com');
  });
});
