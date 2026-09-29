import { Router } from 'express';
import { togglePhase2, getEventStatus, saveTokenConfig, getTokenConfig, cleanupNonSuperAdminUsers, createUserByAdmin } from '../controllers/adminController';
import { generateAdminCode, listActiveAdminCodes } from '../controllers/adminCodeController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  listRegistrationRequests,
  reviewRegistrationRequest,
  listFamilyAdmins,
  changeFamilyAdminRole,
  resetFamilyMemberPassword,
  listFamilyAuditEvents,
} from '../controllers/accessController';
import { listFamilyInvites } from '../controllers/inviteController';

const router = Router();

router.get('/registration-requests', authMiddleware, adminMiddleware, listRegistrationRequests);
router.patch('/registration-requests/:requestId/:action', authMiddleware, adminMiddleware, reviewRegistrationRequest);
router.get('/family-admins', authMiddleware, adminMiddleware, listFamilyAdmins);
router.patch('/family-members/:userId/reset-password', authMiddleware, adminMiddleware, resetFamilyMemberPassword);
router.patch('/family-admins/:userId', authMiddleware, adminMiddleware, changeFamilyAdminRole);
router.get('/audit-events', authMiddleware, adminMiddleware, listFamilyAuditEvents);
router.get('/invitations', authMiddleware, adminMiddleware, listFamilyInvites);

router.put('/event/:eventId/phase2', authMiddleware, adminMiddleware, togglePhase2);
router.get('/event/:eventId/status', authMiddleware, adminMiddleware, getEventStatus);
router.post('/admin-code', authMiddleware, adminMiddleware, generateAdminCode);
router.get('/admin-codes', authMiddleware, adminMiddleware, listActiveAdminCodes);
router.post('/token-config', authMiddleware, adminMiddleware, saveTokenConfig);
router.get('/token-config/:eventId', authMiddleware, adminMiddleware, getTokenConfig);
router.post('/cleanup-users', authMiddleware, adminMiddleware, cleanupNonSuperAdminUsers);
router.post('/create-user', authMiddleware, adminMiddleware, createUserByAdmin);

export default router;
