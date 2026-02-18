import { jest } from '@jest/globals';

jest.resetModules();
process.env.DISABLE_DOTENV = 'true';
process.env.REFRESH_TOKEN_SECRET = '';
process.env.DATABASE_URL = 'postgresql://x';
process.env.JWT_SECRET = 'secret';

const mockFindUserByEmail = jest.fn();

jest.unstable_mockModule('../src/modules/auth/auth.repository.js', () => ({
  findUserByEmail: mockFindUserByEmail,
  createUser: jest.fn()
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hash'),
    compare: jest.fn().mockResolvedValue(true)
  }
}));

const authService = await import('../src/modules/auth/auth.service.js');

describe('auth.service refresh token optional', () => {
  it('returns null refreshToken when not configured', async () => {
    mockFindUserByEmail.mockResolvedValue({ id: '1', password_hash: 'hash', role: 'admin' });
    const res = await authService.login({ email: 'a@b.com', password: 'password123' });
    expect(res.refreshToken).toBeNull();
  });
});
