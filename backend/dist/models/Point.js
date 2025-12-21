"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = void 0;
const mongoose_1 = require("mongoose");
const pointSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    stallId: {
        type: String,
        required: true,
        index: true,
    },
    points: {
        type: Number,
        required: true,
        min: 0,
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    qrCodeData: {
        type: String,
    },
    awardedBy: {
        type: String,
        required: true,
    },
    awardedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
pointSchema.index({ userId: 1, stallId: 1 });
pointSchema.index({ awardedAt: -1 });
exports.Point = (0, mongoose_1.model)('Point', pointSchema);
