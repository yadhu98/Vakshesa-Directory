import { Router } from 'express';
import { getUserProfile, getFamilyTreeStructure, search, getLeaderboardData, toggleUserStatus, updateUser, deleteUser } from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Specific routes first (before parameterized routes)
router.get('/search', authMiddleware, search);
router.get('/leaderboard', authMiddleware, getLeaderboardData);
router.get('/family/:familyId/tree', authMiddleware, getFamilyTreeStructure);

// Parameterized routes last
router.get('/:userId', authMiddleware, getUserProfile);
router.put('/:userId/profile', authMiddleware, updateUser);
router.patch('/:userId/status', authMiddleware, adminMiddleware, toggleUserStatus);
router.put('/:userId', authMiddleware, adminMiddleware, updateUser);
router.delete('/:userId', authMiddleware, adminMiddleware, deleteUser);

export default router;
