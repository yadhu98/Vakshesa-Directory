import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/auth';
import {
  createEvent,
  getEvents,
  getActiveEvent,
  getEventById,
  updateEvent,
  togglePhase2,
  deleteEvent,
  updateEventStatus,
} from '../controllers/eventController';

const router = Router();

// Public routes (authenticated users)
router.get('/active', authMiddleware, getActiveEvent);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createEvent);
router.get('/', authMiddleware, adminMiddleware, getEvents);
router.get('/:id', authMiddleware, adminMiddleware, getEventById);
router.put('/:id', authMiddleware, adminMiddleware, updateEvent);
router.patch('/:id/phase2', authMiddleware, adminMiddleware, togglePhase2);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateEventStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteEvent);

export default router;
