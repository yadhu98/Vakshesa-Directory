import { Request, Response } from 'express';
import { db } from '../config/storage';

const CODE_TTL_MS = 60 * 1000; // 1 minute

export const generateAdminCode = async (req: Request, res: Response): Promise<void> => {
  try {
    // Simple 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    const record = await db.create('adminCodes', {
      code,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Admin validation code generated', code: record.code, expiresAt });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listActiveAdminCodes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    const codes = (await db.find('adminCodes', {}))
      .filter((c: any) => !c.used && new Date(c.expiresAt).getTime() > now)
      .map((c: any) => ({ code: c.code, expiresAt: c.expiresAt }));
    res.json({ codes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
