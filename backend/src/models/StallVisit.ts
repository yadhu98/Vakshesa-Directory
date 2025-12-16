import { Schema, model } from 'mongoose';

export interface IStallVisit {
  _id?: string;
  userId: string;
  stallId: string;
  eventId?: string;
  visitedAt: Date;
  tokensSpent?: number;
  createdAt: Date;
  updatedAt: Date;
}

const stallVisitSchema = new Schema<IStallVisit>(
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
    eventId: {
      type: String,
      index: true,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
    tokensSpent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound indexes
stallVisitSchema.index({ userId: 1, stallId: 1 });
stallVisitSchema.index({ stallId: 1, visitedAt: -1 });
stallVisitSchema.index({ userId: 1, visitedAt: -1 });

export const StallVisit = model<IStallVisit>('StallVisit', stallVisitSchema);
