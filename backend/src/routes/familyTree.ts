import { Router } from 'express';
import {
  getFamilyTree,
  getFamilyMember,
  updateFamilyRelationships,
  getGenerationMembers,
  searchForRelatives,
  getMemberPath,
} from '../controllers/familyTreeController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Get full family tree
router.get('/:familyId', authMiddleware, getFamilyTree);

// Get specific generation members
router.get('/:familyId/generation/:generation', authMiddleware, getGenerationMembers);

// Search for relatives (for relationship selection)
router.get('/search/relatives', authMiddleware, searchForRelatives);

// Get specific member with immediate family
router.get('/member/:userId', authMiddleware, getFamilyMember);

// Get breadcrumb path to member
router.get('/member/:userId/path', authMiddleware, getMemberPath);

// Update family relationships (admin only)
router.patch('/member/:userId/relationships', authMiddleware, adminMiddleware, updateFamilyRelationships);

export default router;
