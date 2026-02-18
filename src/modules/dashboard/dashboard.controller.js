import { ok } from '../../utils/response.util.js';
import * as dashboardService from './dashboard.service.js';

// Return overview KPIs.
export async function overview(req, res, next) {
  try {
    const data = await dashboardService.getDashboardOverview();
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

// Return performance metrics per recitation.
export async function performance(req, res, next) {
  try {
    const data = await dashboardService.getDashboardPerformance();
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}

// Return chart-ready stats for a period.
export async function stats(req, res, next) {
  try {
    const data = await dashboardService.getDashboardStats(req.query.period);
    return ok(res, data, 200);
  } catch (err) {
    return next(err);
  }
}
