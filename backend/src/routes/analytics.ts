import express from 'express';
import {
  getCarnivalOverview,
  getStallsByGross,
  getTransactionsByUser,
  getRechargeHistory,
  getUserAnalytics,
} from '../controllers/analyticsController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// All analytics routes require admin access
router.get('/carnival/overview', authMiddleware, adminMiddleware, getCarnivalOverview);
router.get('/carnival/stalls/gross', authMiddleware, adminMiddleware, getStallsByGross);
router.get('/carnival/transactions/by-user', authMiddleware, adminMiddleware, getTransactionsByUser);
router.get('/carnival/recharges', authMiddleware, adminMiddleware, getRechargeHistory);
router.get('/users/:userId/analytics', authMiddleware, adminMiddleware, getUserAnalytics);

export default router;
