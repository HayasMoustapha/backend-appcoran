import { AppError } from '../../middlewares/error.middleware.js';
import {
  createProfile,
  deleteProfile,
  getProfileByUserId,
  getPublicProfile,
  updateProfile
} from './profile.repository.js';

// Create a profile (one per admin user).
export async function createImamProfile(userId, payload) {
  const existing = await getProfileByUserId(userId);
  if (existing) throw new AppError('Profile already exists', 409);
  return createProfile({ userId, ...payload });
}

// Get admin profile by user.
export async function getImamProfile(userId) {
  const profile = await getProfileByUserId(userId);
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

// Update admin profile.
export async function updateImamProfile(userId, payload) {
  const existing = await getProfileByUserId(userId);
  if (!existing) throw new AppError('Profile not found', 404);
  if (Object.keys(payload).length === 0) throw new AppError('No fields to update', 400);
  return updateProfile(userId, payload);
}

// Delete admin profile.
export async function removeImamProfile(userId) {
  const existing = await getProfileByUserId(userId);
  if (!existing) throw new AppError('Profile not found', 404);
  await deleteProfile(userId);
}

// Public profile (first profile in table).
export async function getPublicImamProfile() {
  const profile = await getPublicProfile();
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}
