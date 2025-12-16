import { Router } from 'express';
import {
  createStall,
  getStalls,
  getMyStalls,
  getStallByQR,
  participateInStall,
  awardPoints,
  updateStall,
  deleteStall,
  getStallParticipants,
  getStallTransactions,
} from '../controllers/carnivalStallController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Stall management (for keepers)
router.post('/', createStall); // Create new stall
router.get('/my-stalls', getMyStalls); // Get stalls created by current user
router.get('/', getStalls); // Get all stalls for a carnival event
router.get('/qr/:qrCode', getStallByQR); // Get stall by QR code
router.get('/code/:shortCode', getStallByQR); // Get stall by short code (reuses same handler)
router.put('/:stallId', updateStall); // Update stall details
router.delete('/:stallId', deleteStall); // Delete stall

// Participation
router.post('/participate', participateInStall); // User scans QR and participates
router.get('/:stallId/participants', getStallParticipants); // Get participants for a stall
router.get('/:stallId/transactions', getStallTransactions); // Get transaction history and revenue (for stall admins)

// Points awarding
router.patch('/participation/:participationId/award', awardPoints); // Award points to participant

export default router;
