import { Schema, model } from 'mongoose';

export interface IAdminCode {
  _id?: string;
  code: string;
  createdBy: string;
  used: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminCodeSchema = new Schema<IAdminCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
adminCodeSchema.index({ used: 1 });
adminCodeSchema.index({ expiresAt: 1 });

export const AdminCode = model<IAdminCode>('AdminCode', adminCodeSchema);
