import { Response } from 'express';
import { db } from '../config/storage';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { recordAuditEvent } from '../services/auditService';

const frontendOrigin = (req: AuthRequest): string => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const requestUrl = req.get('origin') || req.get('referer');
  if (requestUrl) {
    try { return new URL(requestUrl).origin; } catch {}
  }
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
};

export const createInviteToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = userId ? await db.findById('users', userId) : null;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!user.familyId || (req.user?.familyId && user.familyId !== req.user.familyId)) {
      res.status(403).json({ message: 'You can only invite people to your own family directory' });
      return;
    }

    const family = await db.findById('families', user.familyId);
    const familyName = family?.name || user.house || 'Family directory';
    const email = typeof req.body.email === 'string' && req.body.email.trim()
      ? req.body.email.trim().toLowerCase()
      : undefined;
    const relationshipNote = typeof req.body.relationshipNote === 'string'
      ? req.body.relationshipNote.trim().slice(0, 1000)
      : '';
    if (!relationshipNote) {
      res.status(400).json({ message: 'Please explain the relationship of the invitee with Vakshesa' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await db.create('inviteTokens', {
      token,
      createdBy: userId,
      createdByName: `${user.firstName} ${user.lastName}`.trim(),
      createdByHouse: user.house || null,
      familyId: user.familyId,
      familyName,
      email,
      relationshipNote,
      used: false,
      revokedAt: null,
      expiresAt,
    });
    await recordAuditEvent(userId!, user.role, 'invitation_created', undefined, {
      familyId: user.familyId,
      inviteId: String(invite._id),
      invitedEmail: email || null,
    });

    res.status(201).json({
      message: 'Invitation created',
      token,
      familyId: user.familyId,
      familyName,
      relationshipNote,
      expiresAt,
      inviteLink: `${frontendOrigin(req)}/register?invite=${token}`,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const validateInviteToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invite = await db.findOne('inviteTokens', { token: req.params.token });
    if (!invite || invite.used || invite.revokedAt || new Date(invite.expiresAt).getTime() <= Date.now()) {
      res.status(400).json({ message: 'Invalid, expired, or already used invitation', valid: false });
      return;
    }
    const inviter = await db.findById('users', String(invite.createdBy));
    if (!inviter || inviter.isActive === false || inviter.membershipStatus !== 'Approved') {
      res.status(400).json({ message: 'This invitation is no longer valid', valid: false });
      return;
    }
    const family = await db.findById('families', invite.familyId || inviter.familyId);
    res.json({
      valid: true,
      createdByName: invite.createdByName,
      familyId: invite.familyId || inviter.familyId,
      familyName: invite.familyName || family?.name || inviter.house || 'Family directory',
      email: invite.email || null,
      relationshipNote: invite.relationshipNote || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message, valid: false });
  }
};

export const getMyInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invites = await db.find('inviteTokens', { createdBy: req.user?.id });
    res.json({ invites: invites.map((invite: any) => ({
      id: invite._id,
      used: invite.used,
      usedAt: invite.usedAt,
      revokedAt: invite.revokedAt,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      familyId: invite.familyId,
      familyName: invite.familyName,
      relationshipNote: invite.relationshipNote || null,
      inviteLink: invite.used || invite.revokedAt || new Date(invite.expiresAt).getTime() <= Date.now()
        ? null
        : `${frontendOrigin(req)}/register?invite=${invite.token}`,
    })) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const revokeInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invite = await db.findById('inviteTokens', req.params.inviteId);
    if (!invite || invite.familyId !== req.user?.familyId) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }
    if (invite.createdBy !== req.user?.id && req.user?.role !== 'admin' && !req.user?.isSuperUser) {
      res.status(403).json({ message: 'Only the inviter or a family admin can revoke this invitation' });
      return;
    }
    if (invite.used || invite.revokedAt || new Date(invite.expiresAt).getTime() <= Date.now()) {
      res.status(409).json({ message: 'This invitation can no longer be revoked' });
      return;
    }
    const updated = await db.updateOne('inviteTokens', { _id: invite._id, used: false, revokedAt: null }, { revokedAt: new Date() });
    if (!updated) {
      res.status(409).json({ message: 'This invitation can no longer be revoked' });
      return;
    }
    await recordAuditEvent(String(req.user?.id), String(req.user?.role), 'invitation_revoked', undefined, {
      familyId: invite.familyId,
      inviteId: String(invite._id),
      invitedEmail: invite.email || null,
    });
    res.json({ message: 'Invitation revoked' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listFamilyInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invites = await db.find('inviteTokens', { familyId: req.user?.familyId });
    const results = await Promise.all(invites.map(async (invite: any) => {
      const creator = await db.findById('users', String(invite.createdBy));
      return {
        id: invite._id,
        familyName: invite.familyName,
        invitedEmail: invite.email || null,
        relationshipNote: invite.relationshipNote || null,
        createdBy: creator ? `${creator.firstName} ${creator.lastName}`.trim() : 'Former member',
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        used: !!invite.used,
        usedAt: invite.usedAt,
        revokedAt: invite.revokedAt,
      };
    }));
    res.json({ invitations: results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
