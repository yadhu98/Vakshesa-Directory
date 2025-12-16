import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';

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

    const superAdminEmail = 'admin@vakshesa.com';

    // Get count before deletion
    const allUsersBefore = await db.find('users', {});
    const countBefore = allUsersBefore.length;

    // Delete all users except Super Admin
    const result = await db.deleteMany('users', { email: { $ne: superAdminEmail } });

    // Get remaining users
    const remainingUsers = await db.find('users', {});

    res.json({
      message: 'Cleanup completed successfully',
      stats: {
        usersBeforeCleanup: countBefore,
        deletedCount: result.deletedCount,
        remainingUsers: remainingUsers.length,
        keptUser: remainingUsers[0] ? `${remainingUsers[0].firstName} ${remainingUsers[0].lastName} (${remainingUsers[0].email})` : 'None'
      },
      note: 'Super Admin is excluded from family tree. Only Super Admin is kept.',
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
};
