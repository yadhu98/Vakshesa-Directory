import { Schema, model } from 'mongoose';

export interface IFamilyTree {
  _id?: string;
  familyId: string;
  name: string; // Family name
  house: string; // Primary house
  rootMembers: string[]; // IDs of the oldest generation members (ancestors)
  totalMembers: number;
  totalGenerations: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const familyTreeSchema = new Schema<IFamilyTree>(
  {
    familyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    house: {
      type: String,
      required: true,
    },
    rootMembers: {
      type: [String],
      default: [],
    },
    totalMembers: {
      type: Number,
      default: 0,
    },
    totalGenerations: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const FamilyTree = model<IFamilyTree>('FamilyTree', familyTreeSchema);
