"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Family = void 0;
const mongoose_1 = require("mongoose");
const familySchema = new mongoose_1.Schema({
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
    headOfFamily: {
        type: String,
        ref: 'User',
    },
    members: [
        {
            type: String,
            ref: 'User',
        },
    ],
    treeStructure: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
familySchema.index({ members: 1 });
exports.Family = (0, mongoose_1.model)('Family', familySchema);
