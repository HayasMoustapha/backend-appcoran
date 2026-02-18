import { jest } from '@jest/globals';

const mockFindUserByEmail = jest.fn();
const mockCreateUser = jest.fn();

jest.unstable_mockModule('../src/modules/auth/auth.repository.js', () => ({
  findUserByEmail: mockFindUserByEmail,
  createUser: mockCreateUser
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hash'),
    compare: jest.fn()
  }
}));

const authService = await import('../src/modules/auth/auth.service.js');

const bcrypt = (await import('bcrypt')).default;

describe('auth.service', () => {
  beforeEach(() => {
    mockFindUserByEmail.mockReset();
    mockCreateUser.mockReset();
  });

  it('registers a new user', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'admin' });

    const user = await authService.register({ email: 'a@b.com', password: 'password123' });

    expect(user.email).toBe('a@b.com');
    expect(mockCreateUser).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    mockFindUserByEmail.mockResolvedValue({ id: '1' });
    await expect(authService.register({ email: 'a@b.com', password: 'password123' }))
      .rejects.toThrow('Email already registered');
  });

  it('logs in with valid credentials', async () => {
    mockFindUserByEmail.mockResolvedValue({ id: '1', password_hash: 'hash', role: 'admin' });
    bcrypt.compare.mockResolvedValue(true);

    const res = await authService.login({ email: 'a@b.com', password: 'password123' });
    expect(res.token).toBeTruthy();
  });

  it('rejects when user not found', async () => {
    mockFindUserByEmail.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'a@b.com', password: 'password123' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects invalid credentials', async () => {
    mockFindUserByEmail.mockResolvedValue({ id: '1', password_hash: 'hash', role: 'admin' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(authService.login({ email: 'a@b.com', password: 'password123' }))
      .rejects.toThrow('Invalid credentials');
  });
});
