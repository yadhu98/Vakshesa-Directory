import { DEFAULT_PRIVACY_SETTINGS } from '../models/User';

export const sanitizeUserForViewer = (user: any, viewerId: string) => {
  if (!user) return user;
  const { password, ...safeUser } = user;
  if (String(user._id) === String(viewerId)) return safeUser;

  const settings = { ...DEFAULT_PRIVACY_SETTINGS, ...(user.privacySettings || {}) };
  const visibleFields = Object.keys(settings).filter((field) => settings[field] === 'family');
  for (const field of Object.keys(safeUser)) {
    if (field !== '_id' && field !== 'familyId' && !visibleFields.includes(field)) delete safeUser[field];
  }
  delete safeUser.privacySettings;
  delete safeUser.membershipStatus;
  delete safeUser.membershipReviewedBy;
  delete safeUser.membershipReviewedAt;
  delete safeUser.membershipRejectionReason;
  delete safeUser.isSuperUser;
  safeUser.role = user.role;
  return safeUser;
};
