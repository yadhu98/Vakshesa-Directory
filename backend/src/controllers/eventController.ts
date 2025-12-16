import { Request, Response } from 'express';
import { db } from '../config/storage';
import { IEvent, EventStatus } from '../models/Event';

/**
 * Create a new event
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      location, 
      status, 
      maxPoints,
      bannerImage 
    } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, start date, and end date are required',
      });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Check if event with same name exists
    const existingEvent = await db.findOne('events', { name });
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: 'Event with this name already exists',
      });
    }

    const newEvent: Partial<IEvent> = {
      name,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || '',
      status: status || 'upcoming',
      isPhase2Active: false,
      maxPoints: maxPoints || 1000,
      bannerImage: bannerImage || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const event = await db.create('events', newEvent);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message,
    });
  }
};

/**
 * Get all events
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { status, isActive } = req.query;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const events = await db.find('events', filter);
    
    // Sort by start date descending (newest first)
    const sortedEvents = events.sort((a: any, b: any) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    res.json({
      success: true,
      data: { 
        events: sortedEvents,
        count: sortedEvents.length 
      },
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message,
    });
  }
};

/**
 * Get active event (for mobile app)
 */
export const getActiveEvent = async (req: Request, res: Response) => {
  try {
    // Find event with status 'active' and isPhase2Active = true
    const events = await db.find('events', { 
      status: 'active', 
      isPhase2Active: true,
      isActive: true 
    });

    if (events.length === 0) {
      return res.json({
        success: true,
        data: { event: null },
        message: 'No active event found',
      });
    }

    // Return the first active event (should only be one)
    const activeEvent = events[0];

    res.json({
      success: true,
      data: { event: activeEvent },
    });
  } catch (error: any) {
    console.error('Error fetching active event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active event',
      error: error.message,
    });
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await db.findOne('events', { _id: id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: { event },
    });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message,
    });
  }
};

/**
 * Update event
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate dates if provided
    if (updates.startDate && updates.endDate) {
      if (new Date(updates.startDate) > new Date(updates.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date',
        });
      }
    }

    // Convert date strings to Date objects
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.phase2StartDate) updates.phase2StartDate = new Date(updates.phase2StartDate);

    updates.updatedAt = new Date();

    const event = await db.update('events', id, updates);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message,
    });
  }
};

/**
 * Toggle Phase 2 for an event
 */
export const togglePhase2 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPhase2Active } = req.body;

    if (typeof isPhase2Active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPhase2Active must be a boolean',
      });
    }

    // If activating Phase 2, set phase2StartDate
    const updates: any = {
      isPhase2Active,
      updatedAt: new Date(),
    };

    if (isPhase2Active) {
      updates.phase2StartDate = new Date();
      
      // Deactivate Phase 2 for all other events
      const allEvents = await db.find('events', {});
      for (const event of allEvents) {
        if (event._id && event._id !== id && event.isPhase2Active) {
          await db.update('events', event._id, { 
            isPhase2Active: false,
            updatedAt: new Date(),
          });
        }
      }
    }

    const event = await db.update('events', id, updates);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      message: `Phase 2 ${isPhase2Active ? 'activated' : 'deactivated'} successfully`,
      data: { event },
    });
  } catch (error: any) {
    console.error('Error toggling Phase 2:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle Phase 2',
      error: error.message,
    });
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await db.findOne('events', { _id: id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    await db.deleteOne('events', { _id: id });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message,
    });
  }
};

/**
 * Update event status
 */
export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: EventStatus[] = ['upcoming', 'active', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: upcoming, active, or completed',
      });
    }

    const event = await db.update('events', id, { 
      status,
      updatedAt: new Date(),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      message: 'Event status updated successfully',
      data: { event },
    });
  } catch (error: any) {
    console.error('Error updating event status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event status',
      error: error.message,
    });
  }
};
