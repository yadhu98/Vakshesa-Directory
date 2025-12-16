import { Router } from 'express';
import { login, updateProfile, getProfile, register, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile', authMiddleware, getProfile);
router.put('/change-password', authMiddleware, changePassword);

export default router;
