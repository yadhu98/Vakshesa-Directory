"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        trim: true,
    },
    isPhase2Active: {
        type: Boolean,
        default: false,
    },
    phase2StartDate: {
        type: Date,
    },
    maxPoints: {
        type: Number,
        default: 1000,
    },
}, { timestamps: true });
exports.Event = (0, mongoose_1.model)('Event', eventSchema);
