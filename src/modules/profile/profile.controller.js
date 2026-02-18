import { ok } from '../../utils/response.util.js';
import * as profileService from './profile.service.js';

// Create profile for current admin.
export async function createProfile(req, res, next) {
  try {
    const profile = await profileService.createImamProfile(req.user.id, req.body);
    return ok(res, profile, 201);
  } catch (err) {
    return next(err);
  }
}

// Get profile for current admin.
export async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getImamProfile(req.user.id);
    return ok(res, profile, 200);
  } catch (err) {
    return next(err);
  }
}

// Update profile for current admin.
export async function updateProfile(req, res, next) {
  try {
    const profile = await profileService.updateImamProfile(req.user.id, req.body);
    return ok(res, profile, 200);
  } catch (err) {
    return next(err);
  }
}

// Delete profile for current admin.
export async function deleteProfile(req, res, next) {
  try {
    await profileService.removeImamProfile(req.user.id);
    return ok(res, { status: 'deleted' }, 200);
  } catch (err) {
    return next(err);
  }
}

// Public profile access.
export async function getPublicProfile(req, res, next) {
  try {
    const profile = await profileService.getPublicImamProfile();
    return ok(res, profile, 200);
  } catch (err) {
    return next(err);
  }
}
