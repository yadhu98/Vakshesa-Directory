import { Request, Response } from 'express';
import { db } from '../config/storage';
import { ICarnivalStall, EventCategory } from '../models/CarnivalStall';
import { IUser } from '../models/User';
import crypto from 'crypto';

// Generate unique QR code for event
const generateQRCode = (): string => {
  return `EVENT_${crypto.randomBytes(16).toString('hex')}`;
};

// Generate short 3-character code for easy manual entry
const generateShortCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) { // Generate 6-character codes
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get all users for admin selection
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.find('users', { isActive: true });
    
    const userList = users.map((user: any) => ({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      house: user.house,
      role: user.role,
    }));

    res.json({ users: userList });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Create carnival event (admin only)
export const createCarnivalEvent = async (req: Request, res: Response) => {
  try {
    const {
      carnivalEventId,
      name,
      description,
      category,
      type,
      participationType,
      adminIds,
      tokenCost,
      gameRules,
      startTime,
      endTime,
      duration,
      maxParticipants,
      location,
    } = req.body;

    const createdBy = (req as any).user?.id;

    if (!createdBy) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: createdBy });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can create carnival events' });
    }

    if (!carnivalEventId || !name || !category || !adminIds || adminIds.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify carnival event exists and Phase 2 is active
    const carnivalEvent = await db.findOne('events', { _id: carnivalEventId });
    if (!carnivalEvent || !carnivalEvent.isPhase2Active) {
      return res.status(400).json({ message: 'Carnival event not found or Phase 2 not active' });
    }

    // Verify all admin users exist
    const adminUsers = await Promise.all(
      adminIds.map((id: string) => db.findOne('users', { _id: id }))
    );
    
    if (adminUsers.some((u: any) => !u)) {
      return res.status(400).json({ message: 'One or more admin users not found' });
    }

    // Generate unique QR code and short code
    let qrCode = generateQRCode();
    let shortCode = generateShortCode();
    
    // Ensure short code is unique
    let existingStall = await db.findOne('carnivalStalls', { shortCode });
    while (existingStall) {
      shortCode = generateShortCode();
      existingStall = await db.findOne('carnivalStalls', { shortCode });
    }

    // Set tokenCost to 0 for stage programs
    const finalTokenCost = category === 'stage_program' ? 0 : parseInt(tokenCost) || 5;

    const eventData: ICarnivalStall = {
      carnivalEventId,
      name,
      description,
      category: category as EventCategory,
      type: type || (category === 'stage_program' ? 'stage_show' : 'game'),
      participationType: participationType || 'individual',
      adminIds: Array.isArray(adminIds) ? adminIds : [adminIds],
      tokenCost: finalTokenCost,
      gameRules: category === 'game' ? gameRules : undefined,
      qrCode,
      shortCode,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      currentParticipants: 0,
      isActive: true,
      isOpen: false, // Closed by default until admin opens it
      location,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const event = await db.create('carnivalStalls', eventData);

    res.status(201).json({
      message: 'Carnival event created successfully',
      event,
    });
  } catch (error: any) {
    console.error('Create carnival event error:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// Get all carnival events (admin)
export const getCarnivalEvents = async (req: Request, res: Response) => {
  try {
    const { carnivalEventId, category, isActive } = req.query;

    const filter: any = {};
    
    if (carnivalEventId) {
      filter.carnivalEventId = carnivalEventId;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const events = await db.find('carnivalStalls', filter);

    // Enrich with admin info
    const enrichedEvents = await Promise.all(
      events.map(async (event: any) => {
        const adminNames = await Promise.all(
          event.adminIds.map(async (adminId: string) => {
            const admin = await db.findOne('users', { _id: adminId });
            return admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown';
          })
        );

        const creator = await db.findOne('users', { _id: event.createdBy });

        const participations = await db.find('stallParticipations', { stallId: event._id });

        return {
          ...event,
          adminNames,
          creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
          totalParticipations: participations.length,
          pendingParticipations: participations.filter((p: any) => p.status === 'pending').length,
        };
      })
    );

    // Sort by creation date
    enrichedEvents.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ events: enrichedEvents });
  } catch (error: any) {
    console.error('Get carnival events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// Update carnival event
export const updateCarnivalEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can update carnival events' });
    }

    const event = await db.findOne('carnivalStalls', { _id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates: any = { updatedAt: new Date() };
    const allowedFields = [
      'name',
      'description',
      'adminIds',
      'tokenCost',
      'gameRules',
      'startTime',
      'endTime',
      'duration',
      'maxParticipants',
      'location',
      'isActive',
      'isOpen',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'adminIds' && Array.isArray(req.body[field])) {
          updates[field] = req.body[field];
        } else if (field === 'startTime' || field === 'endTime') {
          updates[field] = new Date(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Don't allow changing tokenCost for stage programs
    if (event.category === 'stage_program') {
      updates.tokenCost = 0;
    }

    const updatedEvent = await db.update('carnivalStalls', eventId, updates);

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Update carnival event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// Toggle event open/close status
export const toggleEventStatus = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { isOpen } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can toggle event status' });
    }

    const event = await db.findOne('carnivalStalls', { _id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const newOpenStatus = isOpen !== undefined ? isOpen : !event.isOpen;
    
    const updatedEvent = await db.update('carnivalStalls', eventId, {
      isOpen: newOpenStatus,
      updatedAt: new Date(),
    });

    res.json({
      message: `Event ${newOpenStatus ? 'opened' : 'closed'} successfully`,
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Toggle event status error:', error);
    res.status(500).json({ message: 'Failed to toggle event status', error: error.message });
  }
};

// Delete carnival event
export const deleteCarnivalEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { force } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can delete carnival events' });
    }

    const event = await db.findOne('carnivalStalls', { _id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if there are participations
    const participations = await db.find('stallParticipations', { stallId: eventId });
    
    if (participations.length > 0 && force !== 'true') {
      return res.status(400).json({
        message: 'Cannot delete event with existing participations. Set isActive to false instead.',
        participationCount: participations.length
      });
    }

    // Force delete: remove all participations first
    if (force === 'true' && participations.length > 0) {
      for (const participation of participations) {
        await db.deleteOne('stallParticipations', { _id: participation._id });
      }
    }

    await db.deleteOne('carnivalStalls', { _id: eventId });

    res.json({ 
      message: 'Event deleted successfully',
      deletedParticipations: participations.length
    });
  } catch (error: any) {
    console.error('Delete carnival event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

// Get event participations (admin)
export const getEventParticipations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can view participations' });
    }

    const event = await db.findOne('carnivalStalls', { _id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const filter: any = { stallId: eventId };
    if (status) {
      filter.status = status;
    }

    const participations = await db.find('stallParticipations', filter);

    // Enrich with user info
    const enrichedParticipations = await Promise.all(
      participations.map(async (p: any) => {
        const participant = await db.findOne('users', { _id: p.participantId });
        return {
          ...p,
          userName: participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown User',
          participantInfo: participant ? {
            name: `${participant.firstName} ${participant.lastName}`,
            phone: participant.phone,
            house: participant.house,
            email: participant.email,
          } : null,
        };
      })
    );

    // Sort by participation date
    enrichedParticipations.sort((a: any, b: any) =>
      new Date(b.participatedAt).getTime() - new Date(a.participatedAt).getTime()
    );

    res.json({ participations: enrichedParticipations, event });
  } catch (error: any) {
    console.error('Get event participations error:', error);
    res.status(500).json({ message: 'Failed to fetch participations', error: error.message });
  }
};

// Delete a specific participation (admin only)
export const deleteParticipation = async (req: Request, res: Response) => {
  try {
    const { participationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can delete participations' });
    }

    const participation = await db.findOne('stallParticipations', { _id: participationId });
    if (!participation) {
      return res.status(404).json({ message: 'Participation not found' });
    }

    await db.deleteOne('stallParticipations', { _id: participationId });

    res.json({ message: 'Participation deleted successfully' });
  } catch (error: any) {
    console.error('Delete participation error:', error);
    res.status(500).json({ message: 'Failed to delete participation', error: error.message });
  }
};

// Update participation score (admin only)
export const updateParticipationScore = async (req: Request, res: Response) => {
  try {
    const { participationId } = req.params;
    const { score } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user is admin or super user
    const user = await db.findOne('users', { _id: userId });
    if (!user || (user.role !== 'admin' && !user.isSuperUser)) {
      return res.status(403).json({ message: 'Only admins can update scores' });
    }

    if (score === undefined || score === null) {
      return res.status(400).json({ message: 'Score is required' });
    }

    const participation = await db.findOne('stallParticipations', { _id: participationId });
    if (!participation) {
      return res.status(404).json({ message: 'Participation not found' });
    }

    await db.update('stallParticipations', participationId, { score, updatedAt: new Date() });

    res.json({ message: 'Score updated successfully', score });
  } catch (error: any) {
    console.error('Update participation score error:', error);
    res.status(500).json({ message: 'Failed to update score', error: error.message });
  }
};

