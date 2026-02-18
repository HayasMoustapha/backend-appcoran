import { ok } from '../../utils/response.util.js';
import * as authService from './auth.service.js';

export async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return ok(res, user, 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return ok(res, result, 200);
  } catch (err) {
    return next(err);
  }
}
