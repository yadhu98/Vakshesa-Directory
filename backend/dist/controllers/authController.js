"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getProfile = exports.updateProfile = exports.register = exports.login = void 0;
const userService_1 = require("../services/userService");
const storage_1 = require("../config/storage");
const auth_1 = require("../utils/auth");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email or phone number and password are required' });
            return;
        }
        const user = await (0, userService_1.validateUserCredentials)(email, password);
        const token = (0, auth_1.generateToken)(user._id?.toString() || '', user.role, user.isSuperUser);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isSuperUser: user.isSuperUser,
                familyId: user.familyId,
            },
        });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { firstName, lastName, name, email, phone, password, role, familyId, house, validationCode, isSuperUser, inviteToken, isAdminCreated } = req.body;
        // Support both name (mobile) and firstName/lastName (admin)
        let userFirstName = firstName;
        let userLastName = lastName;
        if (!firstName && name) {
            const nameParts = name.trim().split(' ');
            userFirstName = nameParts[0] || 'User';
            userLastName = nameParts.slice(1).join(' ') || 'Family';
        }
        if (!userFirstName || !phone || !password || !house) {
            res.status(400).json({ message: 'Missing required fields: firstName, phone, password, and house are required' });
            return;
        }
        // Validate house
        const validHouses = ['Kadannamanna', 'Ayiranazhi', 'Aripra', 'Mankada'];
        if (!validHouses.includes(house)) {
            res.status(400).json({ message: 'Invalid house. Must be one of: Kadannamanna, Ayiranazhi, Aripra, Mankada' });
            return;
        }
        const normalizedEmail = email.toLowerCase();
        let finalRole = role || 'user';
        // Super user bypass - no email restriction or invite token required
        const allowSuperUser = isSuperUser === true;
        // Validate invite token (required for self-registration, but not for admin-created users or super users)
        if (!allowSuperUser && !isAdminCreated) {
            if (!inviteToken) {
                res.status(400).json({ message: 'Invite token is required for registration' });
                return;
            }
            const tokenRecord = await storage_1.db.findOne('inviteTokens', { token: inviteToken });
            if (!tokenRecord) {
                res.status(400).json({ message: 'Invalid invite token' });
                return;
            }
            if (tokenRecord.used) {
                res.status(400).json({ message: 'Invite token already used' });
                return;
            }
            if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
                res.status(400).json({ message: 'Invite token expired' });
                return;
            }
        }
        if (finalRole === 'admin' && !allowSuperUser) {
            if (!validationCode) {
                res.status(400).json({ message: 'Admin registration requires validationCode' });
                return;
            }
            // Validate admin code
            const codeRecord = await storage_1.db.findOne('adminCodes', { code: validationCode });
            if (!codeRecord) {
                res.status(400).json({ message: 'Invalid validation code' });
                return;
            }
            if (codeRecord.used) {
                res.status(400).json({ message: 'Validation code already used' });
                return;
            }
            if (new Date(codeRecord.expiresAt).getTime() < Date.now()) {
                res.status(400).json({ message: 'Validation code expired' });
                return;
            }
            // Mark code used
            await storage_1.db.updateOne('adminCodes', { _id: codeRecord._id }, { used: true, usedAt: new Date() });
        }
        const user = await (0, userService_1.createUser)({
            firstName: userFirstName,
            lastName: userLastName || '',
            email: normalizedEmail,
            phone,
            password,
            role: finalRole,
            house,
            isSuperUser: !!allowSuperUser,
            familyId: familyId || 'family-default',
        });
        // Mark invite token as used (if not super user)
        if (!allowSuperUser && inviteToken) {
            await storage_1.db.updateOne('inviteTokens', { token: inviteToken }, {
                used: true,
                usedBy: user._id,
                usedAt: new Date(),
            });
        }
        const token = (0, auth_1.generateToken)(user._id?.toString() || '', user.role, user.isSuperUser);
        const { password: _, ...safeUser } = user;
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: safeUser,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.register = register;
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, phone, profession, address } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const allowedUpdates = {};
        if (firstName !== undefined)
            allowedUpdates.firstName = firstName;
        if (lastName !== undefined)
            allowedUpdates.lastName = lastName;
        if (dateOfBirth !== undefined)
            allowedUpdates.dateOfBirth = dateOfBirth;
        if (gender !== undefined)
            allowedUpdates.gender = gender;
        if (phone !== undefined)
            allowedUpdates.phone = phone;
        if (profession !== undefined)
            allowedUpdates.profession = profession;
        if (address !== undefined)
            allowedUpdates.address = address;
        const updatedUser = await (0, userService_1.updateUserProfile)(userId, allowedUpdates);
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateProfile = updateProfile;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const user = await (0, userService_1.updateUserProfile)(userId, {});
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getProfile = getProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters long' });
            return;
        }
        // Get user
        const user = await storage_1.db.findById('users', userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Verify current password
        const bcrypt = require('bcrypt');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await storage_1.db.update('users', userId, { password: hashedPassword });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.changePassword = changePassword;
