import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';
import { wsService } from '../services/websocket';
import { getLeaderboard } from '../services/dataService';

export const addPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, stallId, points, qrCodeData } = req.body;
    const shopkeeperId = req.user?.id;

    if (!userId || !stallId || !points) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const point = await db.create('points', {
      userId,
      stallId,
      points,
      qrCodeData,
      awardedBy: shopkeeperId,
      awardedAt: new Date(),
    });

    // Get updated leaderboard and broadcast
    const leaderboard = await getLeaderboard(100);
    wsService.notifyLeaderboardUpdate(leaderboard);

    res.json({
      message: 'Points added successfully',
      point,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userPoints = await db.find('points', { userId });
    const totalPoints = userPoints.reduce((sum, p) => sum + p.points, 0);

    res.json({ userId, totalPoints });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const recordSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, stallId, amount, description } = req.body;

    if (!userId || !stallId || !amount) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const sale = await db.create('sales', {
      stallId,
      userId,
      amount,
      description,
    });

    res.json({
      message: 'Sale recorded successfully',
      sale,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStallSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stallId } = req.params;
    const stallSales = await db.find('sales', { stallId });
    const totalSales = stallSales.reduce((sum, s) => sum + s.amount, 0);

    res.json({ stallId, totalSales, transactionCount: stallSales.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
