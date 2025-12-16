import { Schema, model } from 'mongoose';

export interface IFamilyNode {
  _id?: string;
  userId: string;
  familyId: string;
  parentId?: string; // Parent user ID for tree structure
  generation: number;
  relationshipType?: string; // son, daughter, father, mother, etc.
  createdAt: Date;
  updatedAt: Date;
}

const familyNodeSchema = new Schema<IFamilyNode>(
  {
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
  },
  { timestamps: true }
);

familyNodeSchema.index({ familyId: 1, userId: 1 });
familyNodeSchema.index({ parentId: 1 });
familyNodeSchema.index({ generation: 1 });

export const FamilyNode = model<IFamilyNode>('FamilyNode', familyNodeSchema);
