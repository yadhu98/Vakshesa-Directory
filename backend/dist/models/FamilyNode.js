"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyNode = void 0;
const mongoose_1 = require("mongoose");
const familyNodeSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    familyId: {
        type: String,
        required: true,
        index: true,
    },
    parentId: {
        type: String,
    },
    generation: {
        type: Number,
        default: 0,
    },
    relationshipType: {
        type: String,
        enum: ['father', 'mother', 'son', 'daughter', 'brother', 'sister', 'spouse', 'grandparent', 'grandchild', 'uncle', 'aunt', 'cousin', 'other'],
    },
}, { timestamps: true });
familyNodeSchema.index({ familyId: 1, userId: 1 });
familyNodeSchema.index({ parentId: 1 });
familyNodeSchema.index({ generation: 1 });
exports.FamilyNode = (0, mongoose_1.model)('FamilyNode', familyNodeSchema);
