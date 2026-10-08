import { Request, Response } from 'express';
import { validateUserCredentials, updateUserProfile, createUser } from '../services/userService';
import { db } from '../config/storage';
import { generateToken } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';
import { DEFAULT_PRIVACY_SETTINGS } from '../models/User';
import { recordAuditEvent } from '../services/auditService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email or phone number and password are required' });
      return;
    }

    const user = await validateUserCredentials(String(email), String(password));
    if (user.membershipStatus === 'Pending') {
      res.status(403).json({ code: 'MEMBERSHIP_PENDING', message: 'Your registration is waiting for admin approval' });
      return;
    }
    if (user.membershipStatus === 'Rejected') {
      res.status(403).json({
        code: 'MEMBERSHIP_REJECTED',
        message: user.membershipRejectionReason || 'Your registration was rejected',
      });
      return;
    }
    if (user.membershipStatus !== 'Approved') {
      res.status(403).json({ message: 'Account approval is required before signing in' });
      return;
    }
    if (user.isActive === false) {
      res.status(403).json({ message: 'This account is inactive' });
      return;
    }
    const token = generateToken(user._id?.toString() || '', user.role, user.isSuperUser);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isSuperUser: user.isSuperUser,
        familyId: user.familyId,
      },
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  let createdUserId: string | undefined;
  let createdRequestId: string | undefined;
  let claimedInviteId: string | undefined;
  try {
    const { firstName, lastName, email, phone, password, house, inviteToken, address, occupation, gender, countryCode, generation } = req.body;
    if (!firstName || !lastName || !phone || !password || !house || !inviteToken) {
      res.status(400).json({ message: 'Complete the required profile fields and use a valid invitation' });
      return;
    }
    if (req.body.role === 'admin' || req.body.isSuperUser === true || req.body.isAdminCreated === true) {
      res.status(403).json({ message: 'Self-registration cannot grant administrative access' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }
    const validHouses = ['Kadannamanna', 'Ayiranazhi', 'Aripra', 'Mankada'];
    if (!validHouses.includes(house)) {
      res.status(400).json({ message: 'Invalid house. Must be one of: Kadannamanna, Ayiranazhi, Aripra, Mankada' });
      return;
    }
    const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;
    const invitation = await db.findOne('inviteTokens', { token: String(inviteToken) });
    if (!invitation || invitation.used || invitation.revokedAt || new Date(invitation.expiresAt).getTime() <= Date.now()) {
      res.status(400).json({ message: 'Invalid, expired, or already used invitation' });
      return;
    }
    if (invitation.email && invitation.email.toLowerCase() !== normalizedEmail) {
      res.status(400).json({ message: 'This invitation was issued to a different email address' });
      return;
    }
    const inviter = await db.findById('users', String(invitation.createdBy));
    if (!inviter || inviter.isActive === false || inviter.membershipStatus !== 'Approved') {
      res.status(400).json({ message: 'The person who issued this invitation is no longer eligible to invite members' });
      return;
    }
    const familyId = invitation.familyId || inviter.familyId;
    if (!familyId) {
      res.status(400).json({ message: 'This invitation is missing its family association' });
      return;
    }

    const user = await createUser({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      countryCode: countryCode || '+91',
      password,
      role: 'user',
      isSuperUser: false,
      membershipStatus: 'Pending',
      privacySettings: { ...DEFAULT_PRIVACY_SETTINGS },
      house,
      familyId,
      address: address || '',
      occupation: occupation || '',
      gender: gender || 'male',
      generation: Number.isInteger(Number(generation)) ? Number(generation) : 1,
    });
    createdUserId = String(user._id);

    const registrationRequest = await db.create('registrationRequests', {
      userId: createdUserId,
      inviteId: String(invitation._id),
      familyId,
      invitedBy: String(invitation.createdBy),
      inviterHouse: inviter.house || (invitation as any).createdByHouse || undefined,
      relationshipNote: (invitation as any).relationshipNote || undefined,
      status: 'Pending',
      submittedAt: new Date(),
    });
    createdRequestId = String(registrationRequest._id);

    const claimedInvite = await db.updateOne('inviteTokens', { _id: invitation._id, used: false, revokedAt: null }, {
      used: true,
      usedBy: createdUserId,
      usedAt: new Date(),
    });
    if (!claimedInvite) {
      await db.deleteOne('registrationRequests', { _id: createdRequestId });
      await db.deleteOne('users', { _id: createdUserId });
      createdUserId = undefined;
      createdRequestId = undefined;
      res.status(409).json({ message: 'This invitation has already been registered' });
      return;
    }
    claimedInviteId = String(invitation._id);

    await recordAuditEvent(createdUserId, 'user', 'registration_submitted', createdUserId, {
      familyId,
      inviteId: String(invitation._id),
      invitedBy: String(invitation.createdBy),
    });

    res.status(202).json({ message: 'Registration submitted for admin approval', status: 'Pending', requestId: createdRequestId });
  } catch (error: any) {
    if (createdRequestId) await db.deleteOne('registrationRequests', { _id: createdRequestId });
    if (createdUserId) await db.deleteOne('users', { _id: createdUserId });
    if (claimedInviteId && createdUserId) {
      await db.updateOne('inviteTokens', { _id: claimedInviteId, usedBy: createdUserId }, { used: false, usedBy: null, usedAt: null });
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, profession, address } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const allowedUpdates: any = {};
    if (firstName !== undefined) allowedUpdates.firstName = firstName;
    if (lastName !== undefined) allowedUpdates.lastName = lastName;
    if (dateOfBirth !== undefined) allowedUpdates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) allowedUpdates.gender = gender;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (profession !== undefined) allowedUpdates.profession = profession;
    if (address !== undefined) allowedUpdates.address = address;

    const updatedUser = await updateUserProfile(userId, allowedUpdates);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePrivacySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const submitted = req.body?.privacySettings;
    if (!userId || !submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
      res.status(400).json({ message: 'Privacy settings are required' });
      return;
    }
    const allowedFields = new Set(Object.keys(DEFAULT_PRIVACY_SETTINGS));
    const updates: Record<string, 'family' | 'private'> = {};
    for (const [field, visibility] of Object.entries(submitted)) {
      if (!allowedFields.has(field) || (visibility !== 'family' && visibility !== 'private')) {
        res.status(400).json({ message: `Invalid privacy setting for ${field}` });
        return;
      }
      updates[field] = visibility;
    }
    const user = await db.findById('users', userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const privacySettings = { ...DEFAULT_PRIVACY_SETTINGS, ...(user.privacySettings || {}), ...updates };
    await db.updateOne('users', { _id: userId }, { privacySettings });
    await recordAuditEvent(userId, user.role, 'profile_privacy_changed', userId, { familyId: user.familyId, fields: Object.keys(updates) });
    res.json({ message: 'Privacy settings updated', privacySettings });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await updateUserProfile(userId, {});

    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' });
      return;
    }

    // Get user
    const user = await db.findById('users', userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update('users', userId, { password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
