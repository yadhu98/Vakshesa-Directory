"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'shopkeeper', 'admin'],
        default: 'user',
    },
    familyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    profilePicture: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
// Index for fast lookups
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ familyId: 1 });
userSchema.index({ role: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
