import { Schema, model } from 'mongoose';

export interface IFamily {
  _id?: string;
  name: string;
  description?: string;
  headOfFamily?: string; // User ID
  members: string[]; // User IDs
  treeStructure?: Record<string, any>; // JSON tree structure
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const familySchema = new Schema<IFamily>(
  {
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
      type: Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

familySchema.index({ members: 1 });

export const Family = model<IFamily>('Family', familySchema);
