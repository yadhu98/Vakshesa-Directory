import { Router } from 'express';
import { createFamily, listFamilies } from '../controllers/familyController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, adminMiddleware, createFamily);
router.get('/', authMiddleware, listFamilies);

export default router;
