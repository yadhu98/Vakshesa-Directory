import express from 'express';
import { createInviteToken, validateInviteToken, getMyInvites } from '../controllers/inviteController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Create a new invite token (authenticated users only)
router.post('/create', authMiddleware, createInviteToken);

// Validate an invite token (public endpoint for registration page)
router.get('/validate/:token', validateInviteToken);

// Get user's created invites (authenticated users only)
router.get('/my-invites', authMiddleware, getMyInvites);

export default router;
