import { Request, Response } from 'express';
import { db } from '../config/storage';
import { ICarnivalStall } from '../models/CarnivalStall';
import { IStallParticipation } from '../models/StallParticipation';
import { IUser } from '../models/User';
import crypto from 'crypto';
import { wsService } from '../services/websocket';
import { getLeaderboard } from '../services/dataService';

// Generate unique QR code for stall
const generateQRCode = (): string => {
  return `STALL_${crypto.randomBytes(16).toString('hex')}`;
};

// Generate short 6-character code for easy manual entry
const generateShortCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) { // Generate 6-character codes
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Note: Event creation is handled by carnivalAdminController.ts
// This is kept for backwards compatibility but should not be used
export const createStall = async (req: Request, res: Response) => {
  res.status(400).json({ 
    message: 'Please use /api/carnival-admin/events endpoint to create events' 
  });
};

// Get all stalls for a carnival event
export const getStalls = async (req: Request, res: Response) => {
  try {
    const { carnivalEventId } = req.query;

    if (!carnivalEventId) {
      return res.status(400).json({ message: 'Carnival event ID required' });
    }

    const filter: any = { carnivalEventId: carnivalEventId as string };
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const stalls = await db.find('carnivalStalls', filter);

    // Enrich with admin info
    const enrichedStalls = await Promise.all(
      stalls.map(async (stall: any) => {
        const adminNames = await Promise.all(
          (stall.adminIds || []).map(async (adminId: string) => {
            const admin = await db.findOne('users', { _id: adminId });
            return admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown';
          })
        );
        return {
          ...stall,
          adminNames,
        };
      })
    );

    res.json({ stalls: enrichedStalls });
  } catch (error: any) {
    console.error('Get stalls error:', error);
    res.status(500).json({ message: 'Failed to fetch stalls', error: error.message });
  }
};

// Get events managed by current user (event admin)
export const getMyStalls = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find events where user is in adminIds array
    const allEvents = await db.find('carnivalStalls', {});
    const myEvents = allEvents.filter((event: any) => 
      event.adminIds && event.adminIds.includes(userId)
    );

    // Get participation counts
    const enrichedEvents = await Promise.all(
      myEvents.map(async (event: any) => {
        const participations = await db.find('stallParticipations', { stallId: event._id });
        const pendingCount = participations.filter((p: any) => p.status === 'pending').length;
        const completedCount = participations.filter((p: any) => p.status === 'completed').length;

        return {
          ...event,
          totalParticipations: participations.length,
          pendingParticipations: pendingCount,
          completedParticipations: completedCount,
        };
      })
    );

    res.json({ stalls: enrichedEvents });
  } catch (error: any) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// Get stall by QR code
export const getStallByQR = async (req: Request, res: Response) => {
  try {
    const { qrCode, shortCode } = req.params;

    // Find by QR code or short code
    const event = qrCode 
      ? await db.findOne('carnivalStalls', { qrCode })
      : await db.findOne('carnivalStalls', { shortCode: shortCode.toUpperCase() });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get admin names
    const adminNames = await Promise.all(
      (event.adminIds || []).map(async (adminId: string) => {
        const admin = await db.findOne('users', { _id: adminId });
        return admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown';
      })
    );

    // Get top winners/participants with scores
    const participations = await db.find('stallParticipations', { stallId: event._id });
    const topWinners = participations
      .filter((p: any) => p.score && p.score > 0)
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map((p: any) => ({
        userId: p.userId,
        name: p.participantName || 'Anonymous',
        score: p.score,
      }));

    res.json({
      stall: {
        ...event,
        adminNames,
        topWinners,
      },
    });
  } catch (error: any) {
    console.error('Get event by QR/code error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// User participates in an event (scan QR and pay tokens OR fill stage program form)
export const participateInStall = async (req: Request, res: Response) => {
  try {
    const { 
      qrCode,
      shortCode, // Accept short 6-character code as alternative to QR
      // Stage program specific fields
      isStageProgram,
      participantName,
      performanceDetails,
      numberOfParticipants,
      groupMembers,
    } = req.body;
    
    const participantId = (req as any).user?.id;

    if (!participantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!qrCode && !shortCode) {
      return res.status(400).json({ message: 'QR code or short code required' });
    }

    // Get event by QR code or short code
    const event = qrCode 
      ? await db.findOne('carnivalStalls', { qrCode })
      : await db.findOne('carnivalStalls', { shortCode: shortCode.toUpperCase() });
      
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ message: 'Event is not active' });
    }    if (!event.isOpen) {
      return res.status(400).json({ message: 'Event is currently closed' });
    }

    // Check if max participants reached
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event has reached maximum participants' });
    }

    const isStage = isStageProgram || event.category === 'stage_program';

    // Validate stage program fields
    if (isStage) {
      if (!participantName) {
        return res.status(400).json({ 
          message: 'Stage programs require participant name' 
        });
      }
    }

    let remainingTokens = 0;

    // Handle token payment
    if (event.tokenCost > 0) {
      const userTokens = await db.find('tokens', { userId: participantId });
      const totalTokens = userTokens.reduce((sum: number, t: any) => sum + (t.balance || 0), 0);

      if (totalTokens < event.tokenCost) {
        return res.status(400).json({ 
          message: 'Insufficient tokens', 
          required: event.tokenCost,
          current: totalTokens,
        });
      }

      // Deduct tokens
      const tokenRecord = userTokens[0];
      if (tokenRecord && tokenRecord._id) {
        await db.update('tokens', tokenRecord._id, {
          balance: tokenRecord.balance - event.tokenCost,
          updatedAt: new Date(),
        });
        remainingTokens = tokenRecord.balance - event.tokenCost;
      }
    }

    // Create participation record
    const participationData: any = {
      stallId: event._id!,
      carnivalEventId: event.carnivalEventId,
      participantId,
      adminIds: event.adminIds || [],
      tokensPaid: event.tokenCost,
      pointsAwarded: 0,
      status: 'pending',
      participatedAt: new Date(),
      isStageProgram: isStage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add stage program specific fields
    if (isStage) {
      participationData.participantName = participantName;
      participationData.participantDetails = performanceDetails || '';
      participationData.performance = performanceDetails || '';
      participationData.groupMembers = groupMembers || [];
      participationData.numberOfParticipants = numberOfParticipants || 1;
    }

    const participation = await db.create('stallParticipations', participationData);

    // Increment current participants
    await db.update('carnivalStalls', event._id!, {
      currentParticipants: event.currentParticipants + 1,
      updatedAt: new Date(),
    });

    // Get participant info
    const participant = await db.findOne('users', { _id: participantId });

    res.status(201).json({
      message: isStage 
        ? 'Successfully registered for stage program!' 
        : 'Successfully joined the event!',
      participation,
      remainingTokens,
      participantInfo: participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown',
    });
  } catch (error: any) {
    console.error('Participate in event error:', error);
    res.status(500).json({ message: 'Failed to participate', error: error.message });
  }
};

// Event admin awards points to participant
export const awardPoints = async (req: Request, res: Response) => {
  try {
    const { participationId } = req.params;
    const { points, notes } = req.body;
    const userId = (req as any).user?.id;

    console.log('Award points request:', { participationId, points, notes, userId, body: req.body });

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if points is a valid number
    const pointsValue = typeof points === 'string' ? parseInt(points) : points;
    if (pointsValue === undefined || pointsValue === null || isNaN(pointsValue) || pointsValue < 0) {
      console.log('Invalid points value:', { points, pointsValue, type: typeof points });
      return res.status(400).json({ message: 'Valid points value required (must be a non-negative number)' });
    }

    // Get participation
    const participation = await db.findById('stallParticipations', participationId);
    console.log('Participation found:', participation ? 'yes' : 'no');
    if (!participation) {
      return res.status(404).json({ message: 'Participation not found' });
    }

    // Get stall to verify admin access
    const stall = await db.findById('carnivalStalls', participation.stallId);
    console.log('Stall found:', stall ? 'yes' : 'no', 'adminIds:', stall?.adminIds);
    if (!stall) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    // Verify user is an admin of this stall
    if (!stall.adminIds || !stall.adminIds.includes(userId)) {
      console.log('Admin check failed - userId:', userId, 'stall.adminIds:', stall.adminIds);
      return res.status(403).json({ message: 'You can only award points for stalls you admin' });
    }

    if (participation.status === 'completed') {
      return res.status(400).json({ message: 'Points already awarded for this participation' });
    }

    // Update participation
    await db.update('stallParticipations', participationId, {
      pointsAwarded: pointsValue,
      status: 'completed',
      pointsAwardedAt: new Date(),
      notes: notes || '',
      updatedAt: new Date(),
    });

    // For stage programs with group members, award points to all participants
    const isStageProgram = participation.isStageProgram || false;
    const groupMembers = participation.groupMembers || [];
    
    if (isStageProgram && groupMembers.length > 0) {
      console.log('🎭 Stage program with group members detected:', groupMembers.length, 'members');
      
      // Award points to the main participant (registrant)
      const mainPointData = {
        userId: participation.participantId,
        stallId: participation.stallId,
        points: pointsValue,
        awardedBy: userId,
        awardedAt: new Date(),
      };
      console.log('Creating point record for main participant:', mainPointData);
      await db.create('points', mainPointData);
      
      // Award points to all group members
      for (const memberId of groupMembers) {
        const memberPointData = {
          userId: memberId,
          stallId: participation.stallId,
          points: pointsValue,
          awardedBy: userId,
          awardedAt: new Date(),
        };
        console.log('Creating point record for group member:', memberPointData);
        await db.create('points', memberPointData);
      }
      
      console.log(`✅ Awarded ${pointsValue} points to ${1 + groupMembers.length} participants`);
    } else {
      // Regular stall or solo stage program - award to single participant
      const pointData = {
        userId: participation.participantId,
        stallId: participation.stallId,
        points: pointsValue,
        awardedBy: userId,
        awardedAt: new Date(),
      };
      console.log('Creating point record:', pointData);
      await db.create('points', pointData);
      console.log('Point created successfully');
    }

    // Get updated leaderboard and broadcast
    const leaderboard = await getLeaderboard(100);
    wsService.notifyLeaderboardUpdate(leaderboard);

    const totalRecipients = isStageProgram && groupMembers.length > 0 ? 1 + groupMembers.length : 1;
    res.json({
      message: isStageProgram && groupMembers.length > 0 
        ? `Points awarded successfully to ${totalRecipients} participants`
        : 'Points awarded successfully',
      pointsAwarded: pointsValue,
      totalRecipients,
    });
  } catch (error: any) {
    console.error('Award points error:', error);
    res.status(500).json({ message: 'Failed to award points', error: error.message });
  }
};

// Get pending participations for a stall (event admin only)
export const getPendingParticipations = async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify event exists
    const event = await db.findOne('carnivalStalls', { _id: stallId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify user is an admin of this event
    if (!event.adminIds || !event.adminIds.includes(userId)) {
      return res.status(403).json({ message: 'You can only view participants for events you admin' });
    }

    // Get participations
    const filter: any = { stallId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const participations = await db.find('stallParticipations', filter);

    // Enrich with user info
    const enrichedParticipations = await Promise.all(
      participations.map(async (p: any) => {
        const user = await db.findOne('users', { _id: p.participantId });
        return {
          ...p,
          participantUserName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          participantPhone: user?.phone,
          participantHouse: user?.house,
        };
      })
    );

    // Sort by participation date
    enrichedParticipations.sort((a: any, b: any) => 
      new Date(b.participatedAt).getTime() - new Date(a.participatedAt).getTime()
    );

    res.json({ participants: enrichedParticipations });
  } catch (error: any) {
    console.error('Get event participants error:', error);
    res.status(500).json({ message: 'Failed to fetch participants', error: error.message });
  }
};

// Update event details
export const updateStall = async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify event exists
    const event = await db.findOne('carnivalStalls', { _id: stallId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify user is an admin of this event
    if (!event.adminIds || !event.adminIds.includes(userId)) {
      return res.status(403).json({ message: 'You can only update events you admin' });
    }

    const updates: any = { updatedAt: new Date() };
    const allowedFields = ['name', 'description', 'tokenCost', 'gameRules', 'startTime', 'endTime', 'duration', 'maxParticipants', 'location', 'isActive', 'isOpen'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedEvent = await db.update('carnivalStalls', stallId, updates);

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// Delete event
export const deleteStall = async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify event exists
    const event = await db.findOne('carnivalStalls', { _id: stallId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify user is an admin of this event
    if (!event.adminIds || !event.adminIds.includes(userId)) {
      return res.status(403).json({ message: 'You can only delete events you admin' });
    }

    // Check if there are participations
    const participations = await db.find('stallParticipations', { stallId });
    if (participations.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete event with existing participations. Set isActive to false instead.',
      });
    }

    await db.deleteOne('carnivalStalls', { _id: stallId });

    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

// Get all participants for a stall
export const getStallParticipants = async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;

    const stall = await db.findById('carnivalStalls', stallId);
    if (!stall) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    const participations = await db.find('stallParticipations', { stallId });

    // Enrich with user details
    const enrichedParticipations = await Promise.all(
      participations.map(async (p: any) => {
        const user = await db.findById('users', p.userId);
        return {
          ...p,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email,
          userPhone: user?.phone,
        };
      })
    );

    res.json({
      stallName: stall.name,
      totalParticipants: enrichedParticipations.length,
      participants: enrichedParticipations,
    });
  } catch (error: any) {
    console.error('Get stall participants error:', error);
    res.status(500).json({ message: 'Failed to fetch participants', error: error.message });
  }
};

// Get stall transaction history and revenue (for stall admins)
export const getStallTransactions = async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stall = await db.findById('carnivalStalls', stallId);
    if (!stall) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    // Verify user is an admin of this stall
    if (!stall.adminIds || !stall.adminIds.includes(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all participations for this stall
    const participations = await db.find('stallParticipations', { stallId });

    // Calculate total revenue - use tokensPaid field
    const totalRevenue = participations.reduce((sum: number, p: any) => sum + (p.tokensPaid || 0), 0);
    const totalParticipants = participations.length;
    const completedTransactions = participations.filter((p: any) => p.status === 'completed').length;

    // Enrich participations with user details
    const enrichedParticipations = await Promise.all(
      participations.map(async (p: any) => {
        const user = await db.findById('users', p.participantId);
        return {
          ...p,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email,
          tokensSpent: p.tokensPaid, // Add this for backward compatibility
        };
      })
    );

    // Sort by date (newest first)
    enrichedParticipations.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      stallName: stall.name,
      summary: {
        totalRevenue,
        totalParticipants,
        completedTransactions,
        averageTokensPerParticipant: totalParticipants > 0 ? totalRevenue / totalParticipants : 0,
      },
      transactions: enrichedParticipations,
    });
  } catch (error: any) {
    console.error('Get stall transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};
