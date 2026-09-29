import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';
import { createUser } from '../services/userService';
import { recordAuditEvent } from '../services/auditService';

export const togglePhase2 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { isActive } = req.body;

    const event = await db.updateOne('events', { _id: eventId }, {
      isPhase2Active: isActive,
      phase2StartDate: isActive ? new Date() : null,
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({
      message: `Phase 2 ${isActive ? 'activated' : 'deactivated'}`,
      event,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEventStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await db.findById('events', eventId);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({
      message: 'Event status retrieved',
      event,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveTokenConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, amountToTokenRatio, minRecharge, maxRecharge, defaultTokenAmount, isActive } = req.body;

    if (!eventId) {
      res.status(400).json({ message: 'Event ID is required' });
      return;
    }

    const event = await db.findById('events', eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const existingConfig = await db.findOne('tokenconfigs', { eventId });

    const configData = {
      eventId,
      amountToTokenRatio: amountToTokenRatio || 2,
      minRecharge: minRecharge || 10,
      maxRecharge: maxRecharge || 1000,
      defaultTokenAmount: defaultTokenAmount || 50,
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date().toISOString(),
    };

    let config;
    if (existingConfig) {
      config = await db.updateOne('tokenconfigs', { eventId }, configData);
    } else {
      config = {
        _id: `tokenconfig_${Date.now()}`,
        ...configData,
        createdAt: new Date().toISOString(),
      };
      await db.create('tokenconfigs', config);
    }

    res.json({
      message: 'Token configuration saved successfully',
      config,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTokenConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const config = await db.findOne('tokenconfigs', { eventId });

    if (!config) {
      res.status(404).json({ message: 'Token configuration not found' });
      return;
    }

    res.json({
      message: 'Token configuration retrieved',
      config,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cleanupNonSuperAdminUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only Super Admin can perform this operation
    if (!req.user?.isSuperUser) {
      res.status(403).json({ message: 'Only Super Admin can perform this operation' });
      return;
    }

    const familyId = req.user.familyId;
    if (!familyId) {
      res.status(400).json({ message: 'Super admin is not associated with a family' });
      return;
    }
    const familyUsers = await db.find('users', { familyId });
    const usersToDelete = familyUsers.filter((user: any) => user.role !== 'admin' && !user.isSuperUser);
    for (const user of usersToDelete) {
      await db.deleteOne('users', { _id: user._id, familyId });
    }
    const remainingUsers = await db.find('users', { familyId });

    res.json({
      message: 'Cleanup completed successfully',
      stats: {
        usersBeforeCleanup: familyUsers.length,
        deletedCount: usersToDelete.length,
        remainingUsers: remainingUsers.length,
        keptUser: remainingUsers[0] ? `${remainingUsers[0].firstName} ${remainingUsers[0].lastName} (${remainingUsers[0].email})` : 'None'
      },
      note: 'Cleanup only affects regular members in this family; all administrators and other families are retained.',
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
};

// Create user by admin (bypasses invite token requirement)
export const createUserByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only admins can create users
    if (req.user?.role !== 'admin' && !req.user?.isSuperUser) {
      res.status(403).json({ message: 'Only admins can create users' });
      return;
    }

    const { firstName, lastName, email, phone, password, house, gender, generation, address, profession } = req.body;

    if (!firstName || !email || !phone || !password || !house) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (!req.user?.familyId) {
      res.status(400).json({ message: 'The admin account is not associated with a family' });
      return;
    }
    const user = await createUser({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      phone,
      password,
      role: 'user',
      membershipStatus: 'Approved',
      isSuperUser: false,
      house,
      gender: gender || 'male',
      generation: generation || 1,
      address: address || '',
      profession: profession || '',
      familyId: req.user.familyId,
    });

    await recordAuditEvent(String(req.user.id), String(req.user.role), 'user_created_by_admin', String(user._id), {
      familyId: req.user.familyId,
    });

    const { sanitizeUserForViewer } = await import('../services/profilePrivacy');
    const safeUser = sanitizeUserForViewer(user, String(req.user.id));

    res.status(201).json({
      message: 'User created successfully by admin',
      user: safeUser,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
