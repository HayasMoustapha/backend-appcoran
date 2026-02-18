import { jest } from '@jest/globals';

const mockOverview = jest.fn();
const mockPerformance = jest.fn();
const mockStats = jest.fn();

jest.unstable_mockModule('../src/modules/dashboard/dashboard.repository.js', () => ({
  getOverview: mockOverview,
  getPerformance: mockPerformance,
  getPeriodStats: mockStats
}));

const service = await import('../src/modules/dashboard/dashboard.service.js');

describe('dashboard.service', () => {
  it('overview', async () => {
    mockOverview.mockResolvedValue({ totalRecitations: 1 });
    const res = await service.getDashboardOverview();
    expect(res.totalRecitations).toBe(1);
  });

  it('performance', async () => {
    mockPerformance.mockResolvedValue([]);
    const res = await service.getDashboardPerformance();
    expect(Array.isArray(res)).toBe(true);
  });

  it('stats period', async () => {
    mockStats.mockResolvedValue([]);
    const res = await service.getDashboardStats('7d');
    expect(Array.isArray(res)).toBe(true);
  });

  it('rejects invalid period', async () => {
    await expect(service.getDashboardStats('90d')).rejects.toThrow('Invalid period');
  });
});
