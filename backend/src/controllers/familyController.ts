import { Request, Response } from 'express';
import { db } from '../config/storage';

export const createFamily = async (req: Request, res: Response): Promise<void> => {
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

export const listFamilies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const families = await db.find('families', {});
    res.json({ families });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
