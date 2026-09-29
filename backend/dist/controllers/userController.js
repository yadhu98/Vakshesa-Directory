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
exports.deleteUser = exports.updateOwnProfile = exports.updateUser = exports.toggleUserStatus = exports.getLeaderboardData = exports.search = exports.getFamilyTreeStructure = exports.getUserProfile = void 0;
const dataService_1 = require("../services/dataService");
const storage_1 = require("../config/storage");
const profilePrivacy_1 = require("../services/profilePrivacy");
const websocket_1 = require("../services/websocket");
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await storage_1.db.findById('users', userId);
        if (!user || user.familyId !== req.user?.familyId || user.isActive === false || user.membershipStatus !== 'Approved') {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json((0, profilePrivacy_1.sanitizeUserForViewer)(user, String(req.user?.id)));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const getFamilyTreeStructure = async (req, res) => {
    try {
        const { familyId } = req.params;
        if (familyId !== req.user?.familyId) {
            res.status(403).json({ message: 'You can only access your own family directory' });
            return;
        }
        const candidateNodes = await (0, dataService_1.getFamilyTree)(familyId);
        const nodes = (await Promise.all(candidateNodes.map(async (node) => {
            const member = await storage_1.db.findById('users', String(node.userId));
            return member && member.familyId === familyId && member.isActive !== false && member.membershipStatus === 'Approved' ? node : null;
        }))).filter(Boolean);
        const tree = (0, dataService_1.buildFamilyTreeStructure)(nodes);
        res.json({ tree, totalMembers: nodes.length });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFamilyTreeStructure = getFamilyTreeStructure;
const search = async (req, res) => {
    try {
        const { q = '', limit = '1000' } = req.query;
        // If q is empty, return all users up to limit
        const results = await (0, dataService_1.searchUsers)(String(q), parseInt(String(limit)), req.user?.familyId, req.user?.id);
        res.json({
            query: q,
            count: results.length,
            results,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.search = search;
const getLeaderboardData = async (req, res) => {
    try {
        const { limit = '100' } = req.query;
        const leaderboard = await (0, dataService_1.getLeaderboard)(parseInt(String(limit)), req.user?.familyId, req.user?.id);
        res.json({
            totalRanked: leaderboard.length,
            leaderboard,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLeaderboardData = getLeaderboardData;
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            res.status(400).json({ message: 'isActive must be a boolean value' });
            return;
        }
        const { db } = await Promise.resolve().then(() => __importStar(require('../config/storage')));
        const user = await db.findById('users', userId);
        if (!user || user.familyId !== req.user?.familyId || user.membershipStatus !== 'Approved') {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (!isActive && user.role === 'admin') {
            const admins = await db.find('users', { familyId: user.familyId, role: 'admin' });
            const activeAdmins = admins.filter((member) => member.isActive !== false && member.membershipStatus === 'Approved');
            if (activeAdmins.length <= 1) {
                res.status(409).json({ message: 'You cannot deactivate the last remaining family admin' });
                return;
            }
        }
        await db.updateOne('users', { _id: userId }, { isActive });
        if (!isActive)
            websocket_1.wsService.disconnectUser(String(userId));
        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            userId,
            isActive,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.toggleUserStatus = toggleUserStatus;
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, email, phone, gender, house, occupation, address, linkedin, instagram, facebook, countryCode, profilePicture } = req.body;
        const { db } = await Promise.resolve().then(() => __importStar(require('../config/storage')));
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
        const updates = {};
        if (firstName !== undefined)
            updates.firstName = firstName;
        if (lastName !== undefined)
            updates.lastName = lastName;
        if (email !== undefined)
            updates.email = normalizedEmail;
        if (phone !== undefined)
            updates.phone = phone;
        if (countryCode !== undefined)
            updates.countryCode = countryCode;
        if (gender !== undefined)
            updates.gender = gender;
        if (house !== undefined)
            updates.house = house;
        if (occupation !== undefined)
            updates.occupation = occupation;
        if (address !== undefined)
            updates.address = address;
        if (linkedin !== undefined)
            updates.linkedin = linkedin;
        if (instagram !== undefined)
            updates.instagram = instagram;
        if (facebook !== undefined)
            updates.facebook = facebook;
        if (profilePicture !== undefined)
            updates.profilePicture = profilePicture;
        await db.updateOne('users', { _id: userId }, updates);
        const updatedUser = await db.findById('users', userId);
        if (!updatedUser) {
            res.status(404).json({ message: 'User not found after update' });
            return;
        }
        res.json((0, profilePrivacy_1.sanitizeUserForViewer)(updatedUser, String(req.user?.id)));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateUser = updateUser;
const updateOwnProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (String(req.user?.id) !== String(userId)) {
            res.status(403).json({ message: 'You can only update your own profile' });
            return;
        }
        const user = await storage_1.db.findById('users', userId);
        if (!user || user.familyId !== req.user?.familyId || user.isActive === false || user.membershipStatus !== 'Approved') {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const fields = ['firstName', 'lastName', 'email', 'phone', 'countryCode', 'gender', 'house', 'occupation', 'address', 'linkedin', 'instagram', 'facebook', 'profilePicture', 'dateOfBirth', 'marriageDate', 'deathDate', 'notes'];
        const updates = {};
        for (const field of fields)
            if (req.body[field] !== undefined)
                updates[field] = req.body[field];
        if (updates.email)
            updates.email = String(updates.email).trim().toLowerCase();
        if (updates.email && updates.email !== user.email) {
            const existing = await storage_1.db.findOne('users', { email: updates.email });
            if (existing && String(existing._id) !== String(userId)) {
                res.status(409).json({ message: 'Email already in use by another user' });
                return;
            }
        }
        if (updates.phone && updates.phone !== user.phone) {
            const existing = await storage_1.db.findOne('users', { phone: updates.phone });
            if (existing && String(existing._id) !== String(userId)) {
                res.status(409).json({ message: 'Phone number already in use by another user' });
                return;
            }
        }
        const updated = await storage_1.db.updateOne('users', { _id: userId }, updates);
        if (!updated) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json((0, profilePrivacy_1.sanitizeUserForViewer)(updated, String(req.user?.id)));
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateOwnProfile = updateOwnProfile;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { db } = await Promise.resolve().then(() => __importStar(require('../config/storage')));
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
        websocket_1.wsService.disconnectUser(String(userId));
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
            const updatedMembers = family.members.filter((id) => id !== userId);
            const updates = { members: updatedMembers };
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
            const updatedChildren = parent.children.filter((id) => id !== userId);
            await db.updateOne('users', { _id: parent._id }, { children: updatedChildren });
        }
        console.log(`Cleaned up family tree relationships for user ${userId}`);
        // Finally, delete the user
        await db.deleteOne('users', { _id: userId });
        res.json({
            message: 'User and all related data deleted successfully',
            userId,
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.deleteUser = deleteUser;
