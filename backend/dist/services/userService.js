"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.validateUserCredentials = exports.createUser = void 0;
const storage_1 = require("../config/storage");
const auth_1 = require("../utils/auth");
const createUser = async (userData) => {
    const existingEmail = await storage_1.db.findOne('users', { email: userData.email });
    const existingPhone = await storage_1.db.findOne('users', { phone: userData.phone });
    if (existingEmail || existingPhone) {
        throw new Error('User with this email or phone already exists');
    }
    const hashedPassword = await (0, auth_1.hashPassword)(userData.password);
    return storage_1.db.create('users', {
        ...userData,
        password: hashedPassword,
    });
};
exports.createUser = createUser;
const validateUserCredentials = async (email, password) => {
    const user = await storage_1.db.findOne('users', { email });
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
