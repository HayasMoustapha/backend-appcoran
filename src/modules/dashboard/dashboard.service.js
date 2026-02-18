import { AppError } from '../../middlewares/error.middleware.js';
import { getOverview, getPerformance, getPeriodStats } from './dashboard.repository.js';

// Overview KPIs for admin dashboard.
export async function getDashboardOverview() {
  return getOverview();
}

// Performance per recitation.
export async function getDashboardPerformance() {
  return getPerformance();
}

// Period stats for 7d/30d/1y.
export async function getDashboardStats(period) {
  const map = { '7d': 7, '30d': 30, '1y': 365 };
  const days = map[period];
  if (!days) throw new AppError('Invalid period', 400);
  return getPeriodStats(days);
}
