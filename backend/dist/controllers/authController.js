"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = exports.login = void 0;
const userService_1 = require("../services/userService");
const auth_1 = require("../utils/auth");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await (0, userService_1.validateUserCredentials)(email, password);
        const token = (0, auth_1.generateToken)(user._id?.toString() || '', user.role);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                familyId: user.familyId,
            },
        });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
};
exports.login = login;
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const allowedUpdates = { firstName, lastName, dateOfBirth, gender };
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
