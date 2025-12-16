import { Router } from 'express';
import { addPoints, getUserPoints, recordSale, getStallSales } from '../controllers/pointsController';
import { authMiddleware, shopkeeperMiddleware } from '../middleware/auth';

const router = Router();

router.post('/add', authMiddleware, shopkeeperMiddleware, addPoints);
router.get('/user/:userId', authMiddleware, getUserPoints);
router.post('/sale', authMiddleware, shopkeeperMiddleware, recordSale);
router.get('/stall/:stallId/sales', authMiddleware, shopkeeperMiddleware, getStallSales);

export default router;
