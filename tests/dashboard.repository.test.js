import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/config/database.js', () => ({
  query: mockQuery
}));

const repo = await import('../src/modules/dashboard/dashboard.repository.js');

describe('dashboard.repository', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('getOverview aggregates', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ count: 4 }] })
      .mockResolvedValueOnce({ rows: [{ count: 5 }] })
      .mockResolvedValueOnce({ rows: [{ value: 6 }] })
      .mockResolvedValueOnce({ rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ rows: [{ numero_sourate: 1 }] });

    const res = await repo.getOverview();
    expect(res.totalRecitations).toBe(1);
  });

  it('getOverview handles empty rows', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ value: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await repo.getOverview();
    expect(res.mostPopularAudio).toBeNull();
    expect(res.mostListenedSurah).toBeNull();
  });

  it('getPerformance returns rows', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await repo.getPerformance();
    expect(Array.isArray(res)).toBe(true);
  });

  it('getPeriodStats returns rows', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const res = await repo.getPeriodStats(7);
    expect(Array.isArray(res)).toBe(true);
  });
});
