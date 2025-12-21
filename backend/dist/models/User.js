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
        enum: ['user', 'admin'],
        default: 'user',
    },
    isSuperUser: {
        type: Boolean,
        default: false,
    },
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
}, { timestamps: true });
// Index for fast lookups
userSchema.index({ role: 1 });
userSchema.index({ house: 1 });
userSchema.index({ familyId: 1, generation: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
