import { Schema, model } from 'mongoose';

export interface IStall {
  _id?: string;
  name: string;
  description?: string;
  type: 'food' | 'game' | 'shopping' | 'activity' | 'other';
  shopkeeperId: string;
  pointsPerTransaction?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stallSchema = new Schema<IStall>(
  {
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
      type: String,
      required: true,
      index: true,
    },
    pointsPerTransaction: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

stallSchema.index({ type: 1 });

export const Stall = model<IStall>('Stall', stallSchema);
