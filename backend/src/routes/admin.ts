import { Router } from 'express';
import { togglePhase2, getEventStatus, saveTokenConfig, getTokenConfig, cleanupNonSuperAdminUsers } from '../controllers/adminController';
import { generateAdminCode, listActiveAdminCodes } from '../controllers/adminCodeController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.put('/event/:eventId/phase2', authMiddleware, adminMiddleware, togglePhase2);
router.get('/event/:eventId/status', authMiddleware, adminMiddleware, getEventStatus);
router.post('/admin-code', authMiddleware, adminMiddleware, generateAdminCode);
router.get('/admin-codes', authMiddleware, adminMiddleware, listActiveAdminCodes);
router.post('/token-config', authMiddleware, adminMiddleware, saveTokenConfig);
router.get('/token-config/:eventId', authMiddleware, adminMiddleware, getTokenConfig);
router.post('/cleanup-users', authMiddleware, adminMiddleware, cleanupNonSuperAdminUsers);

export default router;
