import { Router } from 'express';
import {
  getUsers,
  createCarnivalEvent,
  getCarnivalEvents,
  updateCarnivalEvent,
  toggleEventStatus,
  deleteCarnivalEvent,
  getEventParticipations,
  deleteParticipation,
  updateParticipationScore,
} from '../controllers/carnivalAdminController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// User management
router.get('/users', getUsers); // Get all users for admin selection

// Carnival event management
router.post('/events', createCarnivalEvent); // Create new carnival event
router.get('/events', getCarnivalEvents); // Get all carnival events
router.put('/events/:eventId', updateCarnivalEvent); // Update event details
router.patch('/events/:eventId/toggle', toggleEventStatus); // Open/close event
router.put('/events/:eventId/active', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    const { db } = await import('../config/storage');
    const event = await db.update('carnivalstalls', eventId, { isActive });
    
    if (!event) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    res.json({ 
      message: `Stall ${isActive ? 'activated' : 'deactivated'} successfully`, 
      event 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}); // Toggle active/inactive
router.delete('/events/:eventId', deleteCarnivalEvent); // Delete event (supports ?force=true)
router.get('/events/:eventId/participations', getEventParticipations); // Get participations

// Participation management
router.delete('/participations/:participationId', deleteParticipation); // Delete participation
router.patch('/participations/:participationId', updateParticipationScore); // Update score

export default router;
