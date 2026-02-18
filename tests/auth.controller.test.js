import { jest } from '@jest/globals';

const mockRegister = jest.fn();
const mockLogin = jest.fn();

jest.unstable_mockModule('../src/modules/auth/auth.service.js', () => ({
  register: mockRegister,
  login: mockLogin
}));

const controller = await import('../src/modules/auth/auth.controller.js');

describe('auth.controller', () => {
  it('register responds', async () => {
    mockRegister.mockResolvedValue({ id: '1' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.register({ body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('register passes errors to next', async () => {
    mockRegister.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.register({ body: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('login responds', async () => {
    mockLogin.mockResolvedValue({ token: 'x' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.login({ body: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('login passes errors to next', async () => {
    mockLogin.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.login({ body: {} }, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
