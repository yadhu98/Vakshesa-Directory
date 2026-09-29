"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserByAdmin = exports.cleanupNonSuperAdminUsers = exports.getTokenConfig = exports.saveTokenConfig = exports.getEventStatus = exports.togglePhase2 = void 0;
const storage_1 = require("../config/storage");
const userService_1 = require("../services/userService");
const auditService_1 = require("../services/auditService");
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
        const familyId = req.user.familyId;
        if (!familyId) {
            res.status(400).json({ message: 'Super admin is not associated with a family' });
            return;
        }
        const familyUsers = await storage_1.db.find('users', { familyId });
        const usersToDelete = familyUsers.filter((user) => user.role !== 'admin' && !user.isSuperUser);
        for (const user of usersToDelete) {
            await storage_1.db.deleteOne('users', { _id: user._id, familyId });
        }
        const remainingUsers = await storage_1.db.find('users', { familyId });
        res.json({
            message: 'Cleanup completed successfully',
            stats: {
                usersBeforeCleanup: familyUsers.length,
                deletedCount: usersToDelete.length,
                remainingUsers: remainingUsers.length,
                keptUser: remainingUsers[0] ? `${remainingUsers[0].firstName} ${remainingUsers[0].lastName} (${remainingUsers[0].email})` : 'None'
            },
            note: 'Cleanup only affects regular members in this family; all administrators and other families are retained.',
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
        const { firstName, lastName, email, phone, password, house, gender, generation, address, profession } = req.body;
        if (!firstName || !email || !phone || !password || !house) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (!req.user?.familyId) {
            res.status(400).json({ message: 'The admin account is not associated with a family' });
            return;
        }
        const user = await (0, userService_1.createUser)({
            firstName,
            lastName: lastName || '',
            email: email.toLowerCase(),
            phone,
            password,
            role: 'user',
            membershipStatus: 'Approved',
            isSuperUser: false,
            house,
            gender: gender || 'male',
            generation: generation || 1,
            address: address || '',
            profession: profession || '',
            familyId: req.user.familyId,
        });
        await (0, auditService_1.recordAuditEvent)(String(req.user.id), String(req.user.role), 'user_created_by_admin', String(user._id), {
            familyId: req.user.familyId,
        });
        const { sanitizeUserForViewer } = await Promise.resolve().then(() => __importStar(require('../services/profilePrivacy')));
        const safeUser = sanitizeUserForViewer(user, String(req.user.id));
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
