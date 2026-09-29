import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getFamilyTree, buildFamilyTreeStructure, searchUsers, getLeaderboard } from '../services/dataService';
import { db } from '../config/storage';
import { sanitizeUserForViewer } from '../services/profilePrivacy';
import { wsService } from '../services/websocket';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await db.findById('users', userId);

    if (!user || user.familyId !== req.user?.familyId || user.isActive === false || user.membershipStatus !== 'Approved') {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(sanitizeUserForViewer(user, String(req.user?.id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFamilyTreeStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { familyId } = req.params;
    if (familyId !== req.user?.familyId) {
      res.status(403).json({ message: 'You can only access your own family directory' });
      return;
    }
    const candidateNodes = await getFamilyTree(familyId);
    const nodes = (await Promise.all(candidateNodes.map(async (node: any) => {
      const member = await db.findById('users', String(node.userId));
      return member && member.familyId === familyId && member.isActive !== false && member.membershipStatus === 'Approved' ? node : null;
    }))).filter(Boolean);
    const tree = buildFamilyTreeStructure(nodes);

    res.json({ tree, totalMembers: nodes.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q = '', limit = '1000' } = req.query;

    // If q is empty, return all users up to limit
    const results = await searchUsers(String(q), parseInt(String(limit)), req.user?.familyId, req.user?.id);

    res.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboardData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = '100' } = req.query;
    const leaderboard = await getLeaderboard(parseInt(String(limit)), req.user?.familyId, req.user?.id);

    res.json({
      totalRanked: leaderboard.length,
      leaderboard,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive must be a boolean value' });
      return;
    }

    const { db } = await import('../config/storage');
    const user = await db.findById('users', userId);

    if (!user || user.familyId !== req.user?.familyId || user.membershipStatus !== 'Approved') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!isActive && user.role === 'admin') {
      const admins = await db.find('users', { familyId: user.familyId, role: 'admin' });
      const activeAdmins = admins.filter((member: any) => member.isActive !== false && member.membershipStatus === 'Approved');
      if (activeAdmins.length <= 1) {
        res.status(409).json({ message: 'You cannot deactivate the last remaining family admin' });
        return;
      }
    }

    await db.updateOne('users', { _id: userId }, { isActive });
    if (!isActive) wsService.disconnectUser(String(userId));

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      userId,
      isActive,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, gender, house, occupation, address, linkedin, instagram, facebook, countryCode, profilePicture } = req.body;

    const { db } = await import('../config/storage');
    const user = await db.findById('users', userId);

    if (!user || user.familyId !== req.user?.familyId || user.membershipStatus !== 'Approved') {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if email is being changed and if it's already taken
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await db.findOne('users', { email: normalizedEmail });
      if (existingUser && existingUser._id !== userId) {
        res.status(400).json({ message: 'Email already in use by another user' });
        return;
      }
    }

    const updates: any = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = normalizedEmail;
    if (phone !== undefined) updates.phone = phone;
    if (countryCode !== undefined) updates.countryCode = countryCode;
    if (gender !== undefined) updates.gender = gender;
    if (house !== undefined) updates.house = house;
    if (occupation !== undefined) updates.occupation = occupation;
    if (address !== undefined) updates.address = address;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (instagram !== undefined) updates.instagram = instagram;
    if (facebook !== undefined) updates.facebook = facebook;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    
    await db.updateOne('users', { _id: userId }, updates);

    const updatedUser = await db.findById('users', userId);
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found after update' });
      return;
    }
    
    res.json(sanitizeUserForViewer(updatedUser, String(req.user?.id)));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOwnProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (String(req.user?.id) !== String(userId)) {
      res.status(403).json({ message: 'You can only update your own profile' });
      return;
    }
    const user = await db.findById('users', userId);
    if (!user || user.familyId !== req.user?.familyId || user.isActive === false || user.membershipStatus !== 'Approved') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const fields = ['firstName', 'lastName', 'email', 'phone', 'countryCode', 'gender', 'house', 'occupation', 'address', 'linkedin', 'instagram', 'facebook', 'profilePicture', 'dateOfBirth', 'marriageDate', 'deathDate', 'notes'];
    const updates: Record<string, any> = {};
    for (const field of fields) if (req.body[field] !== undefined) updates[field] = req.body[field];
    if (updates.email) updates.email = String(updates.email).trim().toLowerCase();
    if (updates.email && updates.email !== user.email) {
      const existing = await db.findOne('users', { email: updates.email });
      if (existing && String(existing._id) !== String(userId)) {
        res.status(409).json({ message: 'Email already in use by another user' });
        return;
      }
    }
    if (updates.phone && updates.phone !== user.phone) {
      const existing = await db.findOne('users', { phone: updates.phone });
      if (existing && String(existing._id) !== String(userId)) {
        res.status(409).json({ message: 'Phone number already in use by another user' });
        return;
      }
    }
    const updated = await db.updateOne('users', { _id: userId }, updates);
    if (!updated) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(sanitizeUserForViewer(updated, String(req.user?.id)));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { db } = await import('../config/storage');
    const user = await db.findById('users', userId);

    if (!user || user.familyId !== req.user?.familyId) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(409).json({ message: 'Revoke admin privileges through Access Management before deleting this member' });
      return;
    }

    // Prevent deletion of super admin users
    if (user.isSuperUser) {
      res.status(403).json({ message: 'Cannot delete super admin users' });
      return;
    }
    wsService.disconnectUser(String(userId));

    // CASCADE DELETION: Delete all related records
    console.log(`Starting cascade deletion for user ${userId}`);

    // Delete tokens
    await db.deleteMany('tokens', { userId });
    console.log(`Deleted tokens for user ${userId}`);

    // Delete transactions
    await db.deleteMany('transactions', { userId });
    console.log(`Deleted transactions for user ${userId}`);

    // Delete stall visits
    await db.deleteMany('stallvisits', { userId });
    console.log(`Deleted stall visits for user ${userId}`);

    // Delete points
    await db.deleteMany('points', { userId });
    console.log(`Deleted points for user ${userId}`);

    // Delete sales
    await db.deleteMany('sales', { userId });
    console.log(`Deleted sales for user ${userId}`);

    // Delete stall participations
    await db.deleteMany('stallparticipations', { participantId: userId });
    console.log(`Deleted stall participations for user ${userId}`);

    // Update families - remove user from members arrays and clear headOfFamily if applicable
    const families = await db.find('families', { members: userId });
    for (const family of families) {
      const updatedMembers = family.members.filter((id: string) => id !== userId);
      const updates: any = { members: updatedMembers };
      
      // If user was head of family, clear it
      if (family.headOfFamily === userId) {
        updates.headOfFamily = null;
      }

      await db.updateOne('families', { _id: family._id }, updates);
      console.log(`Updated family ${family._id} - removed user ${userId}`);
    }

    // Clean up family tree relationships in other users
    // Clear fatherId references
    const childrenByFather = await db.find('users', { fatherId: userId });
    for (const child of childrenByFather) {
      await db.updateOne('users', { _id: child._id }, { fatherId: null });
    }

    // Clear motherId references
    const childrenByMother = await db.find('users', { motherId: userId });
    for (const child of childrenByMother) {
      await db.updateOne('users', { _id: child._id }, { motherId: null });
    }

    // Clear spouseId references
    const spouses = await db.find('users', { spouseId: userId });
    for (const spouse of spouses) {
      await db.updateOne('users', { _id: spouse._id }, { spouseId: null });
    }

    // Remove from children arrays
    const parents = await db.find('users', { children: userId });
    for (const parent of parents) {
      const updatedChildren = parent.children.filter((id: string) => id !== userId);
      await db.updateOne('users', { _id: parent._id }, { children: updatedChildren });
    }

    console.log(`Cleaned up family tree relationships for user ${userId}`);

    // Finally, delete the user
    await db.deleteOne('users', { _id: userId });

    res.json({
      message: 'User and all related data deleted successfully',
      userId,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};
