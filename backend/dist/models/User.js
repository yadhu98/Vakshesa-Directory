"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.DEFAULT_PRIVACY_SETTINGS = void 0;
const mongoose_1 = require("mongoose");
exports.DEFAULT_PRIVACY_SETTINGS = {
    email: 'private',
    phone: 'private',
    countryCode: 'private',
    dateOfBirth: 'private',
    gender: 'private',
    address: 'private',
    notes: 'private',
    linkedin: 'private',
    instagram: 'private',
    facebook: 'private',
    marriageDate: 'private',
    deathDate: 'private',
    firstName: 'family',
    lastName: 'family',
    profilePicture: 'family',
    house: 'family',
    occupation: 'family',
    generation: 'family',
    isAlive: 'family',
    fatherId: 'family',
    motherId: 'family',
    spouseId: 'family',
    children: 'family',
};
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
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    countryCode: {
        type: String,
        default: '+91',
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isSuperUser: {
        type: Boolean,
        default: false,
    },
    membershipStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved',
        index: true,
    },
    privacySettings: {
        type: mongoose_1.Schema.Types.Mixed,
        default: () => ({ ...exports.DEFAULT_PRIVACY_SETTINGS }),
    },
    membershipReviewedBy: { type: String },
    membershipReviewedAt: { type: Date },
    membershipRejectionReason: { type: String, trim: true, maxlength: 500 },
    adminChangedBy: { type: String },
    adminChangedAt: { type: Date },
    familyId: {
        type: String,
        required: true,
        index: true,
    },
    house: {
        type: String,
        enum: ['Kadannamanna', 'Ayiranazhi', 'Aripra', 'Mankada'],
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
    // Family tree relationships
    fatherId: {
        type: String,
        index: true,
    },
    motherId: {
        type: String,
        index: true,
    },
    spouseId: {
        type: String,
        index: true,
    },
    children: {
        type: [String],
        default: [],
    },
    generation: {
        type: Number,
        default: 1,
        index: true,
    },
    isAlive: {
        type: Boolean,
        default: true,
    },
    // Additional family info
    marriageDate: {
        type: Date,
    },
    deathDate: {
        type: Date,
    },
    occupation: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    linkedin: {
        type: String,
        trim: true,
    },
    instagram: {
        type: String,
        trim: true,
    },
    facebook: {
        type: String,
        trim: true,
    },
}, { timestamps: true });
// Index for fast lookups
userSchema.index({ role: 1 });
userSchema.index({ house: 1 });
userSchema.index({ familyId: 1, generation: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
