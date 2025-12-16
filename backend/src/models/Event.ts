import { Schema, model } from 'mongoose';

export type EventStatus = 'upcoming' | 'active' | 'completed';

export interface IEvent {
  _id?: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: EventStatus;
  isPhase2Active: boolean;
  phase2StartDate?: Date;
  maxPoints?: number;
  bannerImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
      required: true,
    },
    isPhase2Active: {
      type: Boolean,
      default: false,
    },
    phase2StartDate: {
      type: Date,
    },
    maxPoints: {
      type: Number,
      default: 1000,
    },
    bannerImage: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Event = model<IEvent>('Event', eventSchema);
