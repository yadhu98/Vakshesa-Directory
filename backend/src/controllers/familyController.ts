import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';

export const createFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Family name is required' });
      return;
    }

    const existing = await db.findOne('families', { name });
    if (existing) {
      res.status(409).json({ message: 'Family with this name already exists' });
      return;
    }

    const family = await db.create('families', {
      name,
      description: description || '',
      headOfFamily: null,
      members: [],
      treeStructure: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: 'Family created', family });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listFamilies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const family = req.user?.familyId ? await db.findById('families', req.user.familyId) : null;
    res.json({ families: family ? [family] : [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
