import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { createRelationship, deleteRelationship, getFamilyRelationshipTree, getRelationshipHistory, getRelationshipProfile, howRelated } from '../controllers/relationshipController';

const router = Router();
router.get('/tree', authMiddleware, getFamilyRelationshipTree);
router.get('/admin/history', authMiddleware, adminMiddleware, getRelationshipHistory);
router.get('/how-related', authMiddleware, howRelated);
router.get('/profile/:userId', authMiddleware, getRelationshipProfile);
router.post('/', authMiddleware, createRelationship);
router.delete('/:relationshipId', authMiddleware, deleteRelationship);

export default router;
