"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
const mongoose_1 = require("mongoose");
const saleSchema = new mongoose_1.Schema({
    stallId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Stall',
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        trim: true,
    },
}, { timestamps: true });
saleSchema.index({ stallId: 1, createdAt: -1 });
saleSchema.index({ userId: 1 });
exports.Sale = (0, mongoose_1.model)('Sale', saleSchema);
