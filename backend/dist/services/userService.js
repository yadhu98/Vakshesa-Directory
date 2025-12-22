"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.validateUserCredentials = exports.createUser = void 0;
const storage_1 = require("../config/storage");
const auth_1 = require("../utils/auth");
const createUser = async (userData) => {
    // Check for existing email only if email is provided
    if (userData.email) {
        const existingEmail = await storage_1.db.findOne('users', { email: userData.email });
        if (existingEmail) {
            throw new Error('User with this email already exists');
        }
    }
    const existingPhone = await storage_1.db.findOne('users', { phone: userData.phone });
    if (existingPhone) {
        throw new Error('User with this phone number already exists');
    }
    const hashedPassword = await (0, auth_1.hashPassword)(userData.password);
    return storage_1.db.create('users', {
        ...userData,
        password: hashedPassword,
    });
};
exports.createUser = createUser;
const validateUserCredentials = async (emailOrPhone, password) => {
    // Try to find user by email first, then by phone
    let user = await storage_1.db.findOne('users', { email: emailOrPhone.toLowerCase() });
    if (!user) {
        user = await storage_1.db.findOne('users', { phone: emailOrPhone });
    }
    if (!user) {
        throw new Error('User not found');
    }
    const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }
    return user;
};
exports.validateUserCredentials = validateUserCredentials;
const updateUserProfile = async (userId, updates) => {
    const user = await storage_1.db.updateOne('users', { _id: userId }, updates);
    if (!user)
        return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.updateUserProfile = updateUserProfile;
