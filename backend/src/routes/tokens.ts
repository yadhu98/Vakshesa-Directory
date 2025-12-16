import { Router } from 'express';
import { authMiddleware, adminMiddleware, shopkeeperMiddleware, AuthRequest } from '../middleware/auth';
import {
  generateUserQRCode,
  getTokenBalance,
  rechargeTokens,
  getTransactionHistory,
  getAllTransactions,
  initiatePayment,
  completePayment,
  declinePayment,
  getPendingTransactions,
  getStallVisitStats,
} from '../controllers/tokenController';

const router = Router();

// User routes
router.get('/qrcode', authMiddleware, generateUserQRCode);
router.get('/balance', authMiddleware, getTokenBalance);
router.get('/history', authMiddleware, getTransactionHistory);

// Admin routes
router.post('/recharge', authMiddleware, adminMiddleware, rechargeTokens);
router.get('/transactions', authMiddleware, adminMiddleware, getAllTransactions);
router.get('/stall/:stallId/stats', authMiddleware, adminMiddleware, getStallVisitStats);

// Payment routes - accessible to all authenticated users
router.post('/payment/initiate', authMiddleware, initiatePayment);
router.post('/payment/complete', authMiddleware, shopkeeperMiddleware, completePayment);
router.post('/payment/decline', authMiddleware, shopkeeperMiddleware, declinePayment);
router.get('/payment/pending', authMiddleware, shopkeeperMiddleware, getPendingTransactions);

export default router;
