import { jest } from '@jest/globals';

const mockOverview = jest.fn();
const mockPerformance = jest.fn();
const mockStats = jest.fn();

jest.unstable_mockModule('../src/modules/dashboard/dashboard.service.js', () => ({
  getDashboardOverview: mockOverview,
  getDashboardPerformance: mockPerformance,
  getDashboardStats: mockStats
}));

const controller = await import('../src/modules/dashboard/dashboard.controller.js');

describe('dashboard.controller', () => {
  it('overview responds', async () => {
    mockOverview.mockResolvedValue({});
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.overview({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('overview passes errors to next', async () => {
    mockOverview.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.overview({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('performance responds', async () => {
    mockPerformance.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.performance({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('performance passes errors to next', async () => {
    mockPerformance.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.performance({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('stats responds', async () => {
    mockStats.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.stats({ query: { period: '7d' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('stats passes errors to next', async () => {
    mockStats.mockRejectedValue(new Error('fail'));
    const next = jest.fn();
    await controller.stats({ query: { period: '7d' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
