import { Schema, model } from 'mongoose';

export interface IPoint {
  _id?: string;
  userId: string;
  stallId: string;
  points: number;
  transactionId?: string;
  qrCodeData?: string;
  awardedBy: string; // shopkeeper ID
  awardedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema<IPoint>(
  {
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
  },
  { timestamps: true }
);

pointSchema.index({ userId: 1, stallId: 1 });
pointSchema.index({ awardedAt: -1 });

export const Point = model<IPoint>('Point', pointSchema);
