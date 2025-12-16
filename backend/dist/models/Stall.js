"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stall = void 0;
const mongoose_1 = require("mongoose");
const stallSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['food', 'game', 'shopping', 'activity', 'other'],
        required: true,
    },
    shopkeeperId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pointsPerTransaction: {
        type: Number,
        default: 10,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
stallSchema.index({ shopkeeperId: 1 });
stallSchema.index({ type: 1 });
exports.Stall = (0, mongoose_1.model)('Stall', stallSchema);
