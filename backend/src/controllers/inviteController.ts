import { Response } from 'express';
import { db } from '../config/storage';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Generate a new invite token
export const createInviteToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await db.findOne('users', { _id: userId });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inviteToken = await db.create('inviteTokens', {
      token,
      createdBy: userId,
      createdByName: `${user.firstName} ${user.lastName}`,
      email: req.body.email || null,
      used: false,
      expiresAt,
      createdAt: new Date(),
    });

    res.json({
      message: 'Invite token created successfully',
      token: inviteToken.token,
      expiresAt: inviteToken.expiresAt,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/register?invite=${inviteToken.token}`,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Validate an invite token
export const validateInviteToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const inviteToken = await db.findOne('inviteTokens', { token });

    if (!inviteToken) {
      res.status(404).json({ message: 'Invalid invite token', valid: false });
      return;
    }

    if (inviteToken.used) {
      res.status(400).json({ message: 'Invite token already used', valid: false });
      return;
    }

    if (new Date(inviteToken.expiresAt).getTime() < Date.now()) {
      res.status(400).json({ message: 'Invite token expired', valid: false });
      return;
    }

    res.json({
      valid: true,
      message: 'Invite token is valid',
      createdByName: inviteToken.createdByName,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message, valid: false });
  }
};

// Get user's created invite tokens
export const getMyInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invites = await db.find('inviteTokens', { createdBy: userId });

    res.json({
      invites: invites.map((invite: any) => ({
        token: invite.token,
        used: invite.used,
        usedBy: invite.usedBy,
        usedAt: invite.usedAt,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/register?invite=${invite.token}`,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mark invite token as used (called during registration)
export const markInviteAsUsed = async (token: string, userId: string): Promise<void> => {
  await db.updateOne('inviteTokens', { token }, {
    used: true,
    usedBy: userId,
    usedAt: new Date(),
  });
};
