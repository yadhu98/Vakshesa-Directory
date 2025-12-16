import { Schema, model } from 'mongoose';

export interface ISale {
  _id?: string;
  stallId: string;
  userId: string; // Customer
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>(
  {
    stallId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
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
  },
  { timestamps: true }
);

saleSchema.index({ stallId: 1, createdAt: -1 });

export const Sale = model<ISale>('Sale', saleSchema);
