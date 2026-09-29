"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const profilePrivacy_1 = require("../services/profilePrivacy");
const userService_1 = require("../services/userService");
const storage_1 = require("../config/storage");
const router = (0, express_1.Router)();
// Import manually verified members into the current admin's family only.
router.post('/import-families-bulk', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: 'No data provided' });
        }
        // Group by family (using house as family for this sample, or add familyName to CSV if needed)
        const familiesByName = {};
        data.forEach((row) => {
            const familyName = row.house || 'Unassigned';
            if (!familiesByName[familyName]) {
                familiesByName[familyName] = [];
            }
            familiesByName[familyName].push(row);
        });
        let results = {
            usersCreated: 0,
            familiesCreated: 0,
            relationshipsLinked: 0,
            errors: [],
        };
        // Map to store email -> userId for linking relationships later
        const emailToUserId = {};
        if (!req.user?.familyId)
            return res.status(400).json({ message: 'Admin account is not associated with a family' });
        // Step 1: Create approved members inside the current family only.
        for (const [familyName, members] of Object.entries(familiesByName)) {
            try {
                // Create users
                for (const member of members) {
                    try {
                        const user = await (0, userService_1.createUser)({
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
                            }
                            else {
                                results.errors.push(`User ID for ${member.email} is undefined or not a string`);
                            }
                        }
                        // Create family node
                        await storage_1.db.create('familynodes', {
                            userId: user._id,
                            familyId: req.user.familyId,
                            generation: member.generation || 1,
                        });
                        results.usersCreated++;
                    }
                    catch (error) {
                        const fullError = error && error.stack ? error.stack : JSON.stringify(error);
                        results.errors.push(`Failed to create user ${member.firstName}: ${error.message}`);
                    }
                }
            }
            catch (error) {
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
                const updates = {};
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
                    await storage_1.db.update('users', userId, updates);
                    results.relationshipsLinked++;
                }
            }
            catch (error) {
                results.errors.push(`Failed to link relationships for ${member.email}: ${error.message}`);
            }
        }
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get all families (ensure all houses exist)
router.get('/families', auth_1.authMiddleware, async (req, res) => {
    try {
        const family = req.user?.familyId ? await storage_1.db.findById('families', req.user.familyId) : null;
        res.json(family ? [family] : []);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create family
router.post('/families', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Family name is required' });
            return;
        }
        const existingFamily = await storage_1.db.findOne('families', { name });
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
        await storage_1.db.create('families', newFamily);
        res.status(201).json(newFamily);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get all users (accessible to all authenticated users for directory)
router.get('/users', auth_1.authMiddleware, async (req, res) => {
    try {
        const { role } = req.query;
        let users = await storage_1.db.find('users', { familyId: req.user?.familyId });
        users = users.filter((user) => user.isActive !== false && user.membershipStatus === 'Approved');
        if (role)
            users = users.filter(u => u.role === role);
        const filtered = users.map(u => (0, profilePrivacy_1.sanitizeUserForViewer)(u, String(req.user?.id)));
        res.json({ count: filtered.length, users: filtered });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Link family relationships (after users are created)
// POST body: { userId: "user_id", fatherId: "father_user_id", motherId: "mother_user_id", spouseId: "spouse_user_id" }
router.post('/link-relationships', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { userId, fatherId, motherId, spouseId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }
        const member = await storage_1.db.findById('users', userId);
        if (!member || member.familyId !== req.user?.familyId || member.membershipStatus !== 'Approved') {
            return res.status(404).json({ message: 'Approved family member not found' });
        }
        for (const relatedId of [fatherId, motherId, spouseId].filter(Boolean)) {
            const related = await storage_1.db.findById('users', String(relatedId));
            if (!related || related.familyId !== req.user?.familyId || related.membershipStatus !== 'Approved' || related.isActive === false) {
                return res.status(400).json({ message: 'Relationships must refer to approved members of your family' });
            }
        }
        const updates = {};
        if (fatherId)
            updates.fatherId = fatherId;
        if (motherId)
            updates.motherId = motherId;
        if (spouseId)
            updates.spouseId = spouseId;
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'At least one relationship field is required' });
        }
        await storage_1.db.update('users', userId, updates);
        res.json({
            message: 'Relationships linked successfully',
            updated: { userId, ...updates }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Create stall endpoint
router.post('/stalls', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { name, type, shopkeeperId, pointsPerTransaction, description } = req.body;
        const stall = await storage_1.db.create('stalls', {
            name,
            type,
            shopkeeperId,
            pointsPerTransaction: pointsPerTransaction || 10,
            description: description || '',
            isActive: true,
        });
        res.json({ message: 'Stall created', stall });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Get all stalls
router.get('/stalls', auth_1.authMiddleware, async (req, res) => {
    try {
        const stalls = await storage_1.db.find('stalls', {});
        res.json({ stalls });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create event endpoint
router.post('/events', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { name, description, startDate, endDate, location } = req.body;
        const event = await storage_1.db.create('events', {
            name,
            description: description || '',
            startDate,
            endDate,
            location: location || '',
            isActive: true,
            phase2Enabled: false,
        });
        res.json({ message: 'Event created', event });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Get all events
router.get('/events', auth_1.authMiddleware, async (req, res) => {
    try {
        const events = await storage_1.db.find('events', {});
        res.json({ events });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update event status
router.put('/events/:eventId/status', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { isActive } = req.body;
        const event = await storage_1.db.update('events', eventId, { isActive });
        res.json({ message: 'Event status updated', event });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Update stall active status (toggle isActive)
router.put('/stalls/:stallId/status', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { stallId } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean value' });
        }
        const stall = await storage_1.db.update('stalls', stallId, { isActive });
        if (!stall) {
            return res.status(404).json({ message: 'Stall not found' });
        }
        res.json({
            message: `Stall ${isActive ? 'activated' : 'deactivated'} successfully`,
            stall
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Delete regular members in this family while retaining its administrators.
router.delete('/delete-all-users', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const confirmCode = req.body.confirmCode;
        // Require confirmation code for safety
        if (confirmCode !== 'DELETE_ALL_USERS') {
            return res.status(400).json({ message: 'Invalid confirmation code' });
        }
        const allUsers = await storage_1.db.find('users', { familyId: req.user?.familyId });
        const admins = allUsers.filter((user) => user.role === 'admin' && user.membershipStatus === 'Approved' && user.isActive !== false);
        const usersToDelete = allUsers.filter((user) => user.role !== 'admin' && !user.isSuperUser);
        const userIdsToDelete = usersToDelete.map((user) => String(user._id));
        for (const userId of userIdsToDelete) {
            await storage_1.db.deleteMany('tokens', { userId });
            await storage_1.db.deleteMany('transactions', { userId });
            await storage_1.db.deleteMany('stallvisits', { userId });
            await storage_1.db.deleteMany('points', { userId });
            await storage_1.db.deleteMany('sales', { userId });
            await storage_1.db.deleteMany('stallparticipations', { participantId: userId });
            await storage_1.db.deleteMany('familynodes', { userId });
            await storage_1.db.deleteMany('inviteTokens', { createdBy: userId });
        }
        const deletedSet = new Set(userIdsToDelete);
        const remainingUsers = await storage_1.db.find('users', { familyId: req.user?.familyId });
        for (const user of remainingUsers) {
            const updates = {};
            if (user.fatherId && deletedSet.has(String(user.fatherId)))
                updates.fatherId = null;
            if (user.motherId && deletedSet.has(String(user.motherId)))
                updates.motherId = null;
            if (user.spouseId && deletedSet.has(String(user.spouseId)))
                updates.spouseId = null;
            if (Array.isArray(user.children))
                updates.children = user.children.filter((id) => !deletedSet.has(String(id)));
            if (Object.keys(updates).length)
                await storage_1.db.updateOne('users', { _id: user._id }, updates);
        }
        const family = req.user?.familyId ? await storage_1.db.findById('families', req.user.familyId) : null;
        if (family) {
            const updates = {};
            if (Array.isArray(family.members))
                updates.members = family.members.filter((id) => !deletedSet.has(String(id)));
            if (family.headOfFamily && deletedSet.has(String(family.headOfFamily)))
                updates.headOfFamily = null;
            if (Object.keys(updates).length)
                await storage_1.db.updateOne('families', { _id: family._id }, updates);
        }
        for (const userId of userIdsToDelete)
            await storage_1.db.deleteOne('users', { _id: userId });
        res.json({
            message: `Deleted ${userIdsToDelete.length} regular family members. ${admins.length} family admin(s) were retained.`,
            deletedCount: userIdsToDelete.length,
            adminsPreserved: admins.length,
        });
    }
    catch (error) {
        console.error('Error in bulk delete:', error);
        res.status(500).json({ message: error.message });
    }
});
// Import users from CSV/Excel data
router.post('/import-users', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const users = req.body.users;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: 'No users data provided' });
        }
        const results = {
            created: 0,
            failed: 0,
            errors: [],
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
                const existingUser = await storage_1.db.findOne('users', { email: userData.email });
                if (existingUser) {
                    results.failed++;
                    results.errors.push(`User with email ${userData.email} already exists`);
                    continue;
                }
                // Create user with default password if not provided
                await (0, userService_1.createUser)({
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
            }
            catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Clear all leaderboard data (delete all points)
router.delete('/clear-leaderboard', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
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
        if (!req.user?.familyId)
            return res.status(400).json({ message: 'Admin account is not associated with a family' });
        console.log('Starting leaderboard clear for the current family');
        const points = await storage_1.db.find('points', {});
        let deletedCount = 0;
        for (const point of points) {
            const user = await storage_1.db.findById('users', String(point.userId));
            if (user?.familyId === req.user.familyId && await storage_1.db.deleteOne('points', { _id: point._id }))
                deletedCount++;
        }
        console.log(`Cleared ${deletedCount} point records`);
        res.json({
            message: `Leaderboard cleared successfully. Deleted ${deletedCount} point records.`,
            deletedCount,
        });
    }
    catch (error) {
        console.error('Error clearing leaderboard:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
