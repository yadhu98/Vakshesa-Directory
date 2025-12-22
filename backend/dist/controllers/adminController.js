"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserByAdmin = exports.cleanupNonSuperAdminUsers = exports.getTokenConfig = exports.saveTokenConfig = exports.getEventStatus = exports.togglePhase2 = void 0;
const storage_1 = require("../config/storage");
const userService_1 = require("../services/userService");
const togglePhase2 = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { isActive } = req.body;
        const event = await storage_1.db.updateOne('events', { _id: eventId }, {
            isPhase2Active: isActive,
            phase2StartDate: isActive ? new Date() : null,
        });
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        res.json({
            message: `Phase 2 ${isActive ? 'activated' : 'deactivated'}`,
            event,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.togglePhase2 = togglePhase2;
const getEventStatus = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await storage_1.db.findById('events', eventId);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        res.json({
            message: 'Event status retrieved',
            event,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEventStatus = getEventStatus;
const saveTokenConfig = async (req, res) => {
    try {
        const { eventId, amountToTokenRatio, minRecharge, maxRecharge, defaultTokenAmount, isActive } = req.body;
        if (!eventId) {
            res.status(400).json({ message: 'Event ID is required' });
            return;
        }
        const event = await storage_1.db.findById('events', eventId);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        const existingConfig = await storage_1.db.findOne('tokenconfigs', { eventId });
        const configData = {
            eventId,
            amountToTokenRatio: amountToTokenRatio || 2,
            minRecharge: minRecharge || 10,
            maxRecharge: maxRecharge || 1000,
            defaultTokenAmount: defaultTokenAmount || 50,
            isActive: isActive !== undefined ? isActive : true,
            updatedAt: new Date().toISOString(),
        };
        let config;
        if (existingConfig) {
            config = await storage_1.db.updateOne('tokenconfigs', { eventId }, configData);
        }
        else {
            config = {
                _id: `tokenconfig_${Date.now()}`,
                ...configData,
                createdAt: new Date().toISOString(),
            };
            await storage_1.db.create('tokenconfigs', config);
        }
        res.json({
            message: 'Token configuration saved successfully',
            config,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.saveTokenConfig = saveTokenConfig;
const getTokenConfig = async (req, res) => {
    try {
        const { eventId } = req.params;
        const config = await storage_1.db.findOne('tokenconfigs', { eventId });
        if (!config) {
            res.status(404).json({ message: 'Token configuration not found' });
            return;
        }
        res.json({
            message: 'Token configuration retrieved',
            config,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTokenConfig = getTokenConfig;
const cleanupNonSuperAdminUsers = async (req, res) => {
    try {
        // Only Super Admin can perform this operation
        if (!req.user?.isSuperUser) {
            res.status(403).json({ message: 'Only Super Admin can perform this operation' });
            return;
        }
        const superAdminEmail = 'admin@vakshesa.com';
        // Get count before deletion
        const allUsersBefore = await storage_1.db.find('users', {});
        const countBefore = allUsersBefore.length;
        // Delete all users except Super Admin
        const result = await storage_1.db.deleteMany('users', { email: { $ne: superAdminEmail } });
        // Get remaining users
        const remainingUsers = await storage_1.db.find('users', {});
        res.json({
            message: 'Cleanup completed successfully',
            stats: {
                usersBeforeCleanup: countBefore,
                deletedCount: result.deletedCount,
                remainingUsers: remainingUsers.length,
                keptUser: remainingUsers[0] ? `${remainingUsers[0].firstName} ${remainingUsers[0].lastName} (${remainingUsers[0].email})` : 'None'
            },
            note: 'Super Admin is excluded from family tree. Only Super Admin is kept.',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error during cleanup', error: error.message });
    }
};
exports.cleanupNonSuperAdminUsers = cleanupNonSuperAdminUsers;
// Create user by admin (bypasses invite token requirement)
const createUserByAdmin = async (req, res) => {
    try {
        // Only admins can create users
        if (req.user?.role !== 'admin' && !req.user?.isSuperUser) {
            res.status(403).json({ message: 'Only admins can create users' });
            return;
        }
        const { firstName, lastName, email, phone, password, role, house, gender, generation, address, profession } = req.body;
        if (!firstName || !email || !phone || !password || !house) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await (0, userService_1.createUser)({
            firstName,
            lastName: lastName || '',
            email: email.toLowerCase(),
            phone,
            password,
            role: role || 'user',
            house,
            gender: gender || 'male',
            generation: generation || 1,
            address: address || '',
            profession: profession || '',
            familyId: 'family-default',
        });
        const { password: _, ...safeUser } = user;
        res.status(201).json({
            message: 'User created successfully by admin',
            user: safeUser,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createUserByAdmin = createUserByAdmin;
