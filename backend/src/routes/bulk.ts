import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { sanitizeUserForViewer } from '../services/profilePrivacy';
import { createUser } from '../services/userService';
import { db } from '../config/storage';

const router = Router();

// Import manually verified members into the current admin's family only.
router.post('/import-families-bulk', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const data: any[] = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    // Group by family (using house as family for this sample, or add familyName to CSV if needed)
    const familiesByName: Record<string, any[]> = {};
    data.forEach((row) => {
      const familyName = row.house || 'Unassigned';
      if (!familiesByName[familyName]) {
        familiesByName[familyName] = [];
      }
      familiesByName[familyName].push(row);
    });

    type BulkResults = { usersCreated: number; familiesCreated: number; relationshipsLinked: number; errors: string[] };
    let results: BulkResults = {
      usersCreated: 0,
      familiesCreated: 0,
      relationshipsLinked: 0,
      errors: [] as string[],
    };

    // Map to store email -> userId for linking relationships later
    const emailToUserId: Record<string, string> = {};

    if (!req.user?.familyId) return res.status(400).json({ message: 'Admin account is not associated with a family' });

    // Step 1: Create approved members inside the current family only.
    for (const [familyName, members] of Object.entries(familiesByName)) {
      try {
        // Create users
        for (const member of members) {
          try {
            const user = await createUser({
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
              phone: member.phone,
              password: member.password || 'default123',
              role: 'user',
              membershipStatus: 'Approved',
              familyId: req.user.familyId,
              house: member.house || familyName,
              gender: member.gender,
              generation: member.generation || 1,
              isAlive: member.isAlive !== undefined ? member.isAlive : true,
            });

            // Store email -> userId mapping for later relationship linking
            if (member.email) {
              if (typeof user._id === 'string') {
                emailToUserId[member.email] = user._id;
              } else {
                results.errors.push(`User ID for ${member.email} is undefined or not a string`);
              }
            }

            // Create family node
            await db.create('familynodes', {
              userId: user._id,
              familyId: req.user.familyId,
              generation: member.generation || 1,
            });

            results.usersCreated++;
          } catch (error: any) {
            const fullError = error && error.stack ? error.stack : JSON.stringify(error);
            results.errors.push(`Failed to create user ${member.firstName}: ${error.message}`);
          }
        }
      } catch (error: any) {
        results.errors.push(`Failed to create family ${familyName}: ${error.message}`);
      }
    }

    // Step 2: Link relationships using actual user IDs
    for (const member of data) {
      try {
        const userId = emailToUserId[member.email];
        if (!userId) {
          results.errors.push(`Could not find user ID for ${member.email} to link relationships`);
          continue;
        }

        const updates: any = {};
        
        // Link father
        if (member.fatherId && emailToUserId[member.fatherId]) {
          updates.fatherId = emailToUserId[member.fatherId];
        }
        
        // Link mother
        if (member.motherId && emailToUserId[member.motherId]) {
          updates.motherId = emailToUserId[member.motherId];
        }
        
        // Link spouse
        if (member.spouseId && emailToUserId[member.spouseId]) {
          updates.spouseId = emailToUserId[member.spouseId];
        }

        // Update user with relationship links
        if (Object.keys(updates).length > 0) {
          await db.update('users', userId, updates);
          results.relationshipsLinked++;
        }
      } catch (error: any) {
        results.errors.push(`Failed to link relationships for ${member.email}: ${error.message}`);
      }
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all families (ensure all houses exist)
router.get('/families', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const family = req.user?.familyId ? await db.findById('families', req.user.familyId) : null;
    res.json(family ? [family] : []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create family
router.post('/families', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      res.status(400).json({ message: 'Family name is required' });
      return;
    }

    const existingFamily = await db.findOne('families', { name });
    if (existingFamily) {
      res.status(409).json({ message: 'Family with this name already exists' });
      return;
    }

    const newFamily = {
      _id: `family_${Date.now()}`,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
    };

    await db.create('families', newFamily);
    res.status(201).json(newFamily);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (accessible to all authenticated users for directory)
router.get('/users', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { role } = req.query;
    let users = await db.find('users', { familyId: req.user?.familyId });
    users = users.filter((user: any) => user.isActive !== false && user.membershipStatus === 'Approved');
    
    if (role) users = users.filter(u => u.role === role);
    const filtered = users.map(u => sanitizeUserForViewer(u, String(req.user?.id)));
    
    res.json({ count: filtered.length, users: filtered });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Link family relationships (after users are created)
// POST body: { userId: "user_id", fatherId: "father_user_id", motherId: "mother_user_id", spouseId: "spouse_user_id" }
router.post('/link-relationships', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId, fatherId, motherId, spouseId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const member = await db.findById('users', userId);
    if (!member || member.familyId !== req.user?.familyId || member.membershipStatus !== 'Approved') {
      return res.status(404).json({ message: 'Approved family member not found' });
    }

    for (const relatedId of [fatherId, motherId, spouseId].filter(Boolean)) {
      const related = await db.findById('users', String(relatedId));
      if (!related || related.familyId !== req.user?.familyId || related.membershipStatus !== 'Approved' || related.isActive === false) {
        return res.status(400).json({ message: 'Relationships must refer to approved members of your family' });
      }
    }

    const updates: any = {};
    
    if (fatherId) updates.fatherId = fatherId;
    if (motherId) updates.motherId = motherId;
    if (spouseId) updates.spouseId = spouseId;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'At least one relationship field is required' });
    }

    await db.update('users', userId, updates);
    
    res.json({ 
      message: 'Relationships linked successfully',
      updated: { userId, ...updates }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Create stall endpoint
router.post('/stalls', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, type, shopkeeperId, pointsPerTransaction, description } = req.body;

    const stall = await db.create('stalls', {
      name,
      type,
      shopkeeperId,
      pointsPerTransaction: pointsPerTransaction || 10,
      description: description || '',
      isActive: true,
    });

    res.json({ message: 'Stall created', stall });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get all stalls
router.get('/stalls', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const stalls = await db.find('stalls', {});
    res.json({ stalls });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create event endpoint
router.post('/events', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;

    const event = await db.create('events', {
      name,
      description: description || '',
      startDate,
      endDate,
      location: location || '',
      isActive: true,
      phase2Enabled: false,
    });

    res.json({ message: 'Event created', event });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get all events
router.get('/events', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const events = await db.find('events', {});
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update event status
router.put('/events/:eventId/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const { isActive } = req.body;

    const event = await db.update('events', eventId, { isActive });
    res.json({ message: 'Event status updated', event });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update stall active status (toggle isActive)
router.put('/stalls/:stallId/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { stallId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    const stall = await db.update('stalls', stallId, { isActive });
    
    if (!stall) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    res.json({ 
      message: `Stall ${isActive ? 'activated' : 'deactivated'} successfully`, 
      stall 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete regular members in this family while retaining its administrators.
router.delete('/delete-all-users', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const confirmCode = req.body.confirmCode;
    
    // Require confirmation code for safety
    if (confirmCode !== 'DELETE_ALL_USERS') {
      return res.status(400).json({ message: 'Invalid confirmation code' });
    }

    const allUsers = await db.find('users', { familyId: req.user?.familyId });
    const admins = allUsers.filter((user: any) => user.role === 'admin' && user.membershipStatus === 'Approved' && user.isActive !== false);
    const usersToDelete = allUsers.filter((user: any) => user.role !== 'admin' && !user.isSuperUser);
    const userIdsToDelete = usersToDelete.map((user: any) => String(user._id));

    for (const userId of userIdsToDelete) {
      await db.deleteMany('tokens', { userId });
      await db.deleteMany('transactions', { userId });
      await db.deleteMany('stallvisits', { userId });
      await db.deleteMany('points', { userId });
      await db.deleteMany('sales', { userId });
      await db.deleteMany('stallparticipations', { participantId: userId });
      await db.deleteMany('familynodes', { userId });
      await db.deleteMany('inviteTokens', { createdBy: userId });
    }

    const deletedSet = new Set(userIdsToDelete);
    const remainingUsers = await db.find('users', { familyId: req.user?.familyId });
    for (const user of remainingUsers) {
      const updates: Record<string, any> = {};
      if (user.fatherId && deletedSet.has(String(user.fatherId))) updates.fatherId = null;
      if (user.motherId && deletedSet.has(String(user.motherId))) updates.motherId = null;
      if (user.spouseId && deletedSet.has(String(user.spouseId))) updates.spouseId = null;
      if (Array.isArray(user.children)) updates.children = user.children.filter((id: string) => !deletedSet.has(String(id)));
      if (Object.keys(updates).length) await db.updateOne('users', { _id: user._id }, updates);
    }

    const family = req.user?.familyId ? await db.findById('families', req.user.familyId) : null;
    if (family) {
      const updates: Record<string, any> = {};
      if (Array.isArray(family.members)) updates.members = family.members.filter((id: string) => !deletedSet.has(String(id)));
      if (family.headOfFamily && deletedSet.has(String(family.headOfFamily))) updates.headOfFamily = null;
      if (Object.keys(updates).length) await db.updateOne('families', { _id: family._id }, updates);
    }
    for (const userId of userIdsToDelete) await db.deleteOne('users', { _id: userId });

    res.json({
      message: `Deleted ${userIdsToDelete.length} regular family members. ${admins.length} family admin(s) were retained.`,
      deletedCount: userIdsToDelete.length,
      adminsPreserved: admins.length,
    });
  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: error.message });
  }
});

// Import users from CSV/Excel data
router.post('/import-users', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const users: any[] = req.body.users;
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users data provided' });
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email) {
          results.failed++;
          results.errors.push(`Missing required fields for user: ${userData.email || 'unknown'}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await db.findOne('users', { email: userData.email });
        if (existingUser) {
          results.failed++;
          results.errors.push(`User with email ${userData.email} already exists`);
          continue;
        }

        // Create user with default password if not provided
        await createUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          password: userData.password || 'Password123!',
          role: 'user',
          membershipStatus: 'Approved',
          familyId: req.user?.familyId,
          house: userData.house || 'Kadannamanna',
          gender: userData.gender,
          address: userData.address || '',
          occupation: userData.occupation || userData.profession || '',
          isAlive: userData.isAlive !== undefined ? userData.isAlive : true,
        });

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to create user ${userData.email}: ${error.message}`);
      }
    }

    res.json({
      message: `Import completed. Created: ${results.created}, Failed: ${results.failed}`,
      created: results.created,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all leaderboard data (delete all points)
router.delete('/clear-leaderboard', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('=== CLEAR LEADERBOARD REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const confirmCode = req.body.confirmCode;
    
    // Require confirmation code for safety
    if (confirmCode !== 'CLEAR_LEADERBOARD') {
      console.log('Invalid confirmation code:', confirmCode);
      return res.status(400).json({ message: 'Invalid confirmation code' });
    }

    if (!req.user?.familyId) return res.status(400).json({ message: 'Admin account is not associated with a family' });
    console.log('Starting leaderboard clear for the current family');

    const points = await db.find('points', {});
    let deletedCount = 0;
    for (const point of points) {
      const user = await db.findById('users', String(point.userId));
      if (user?.familyId === req.user.familyId && await db.deleteOne('points', { _id: point._id })) deletedCount++;
    }

    console.log(`Cleared ${deletedCount} point records`);

    res.json({
      message: `Leaderboard cleared successfully. Deleted ${deletedCount} point records.`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Error clearing leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
