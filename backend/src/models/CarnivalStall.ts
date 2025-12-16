import { Schema, model } from 'mongoose';

export type EventCategory = 'game' | 'stage_program';
export type EventType = 'game' | 'activity' | 'stage_show' | 'food' | 'other';
export type ParticipationType = 'individual' | 'group' | 'both';

export interface ICarnivalStall {
  _id?: string;
  carnivalEventId: string; // Reference to main Event
  name: string;
  description?: string;
  category: EventCategory; // game or stage_program
  type: EventType; // specific type
  participationType: ParticipationType; // individual, group, or both
  adminIds: string[]; // Multiple admins can manage this event
  tokenCost: number; // Tokens required (0 for stage programs)
  gameRules?: string; // Rules for games
  qrCode: string; // Unique QR code for this event
  shortCode: string; // 3-character code for easy manual entry
  startTime?: Date; // When this event starts
  endTime?: Date; // When this event ends
  duration?: number; // Duration in minutes
  maxParticipants?: number; // Maximum participants
  currentParticipants: number; // Current participant count
  isActive: boolean;
  isOpen: boolean; // Can accept participants now
  location?: string;
  createdBy: string; // Admin who created this
  createdAt: Date;
  updatedAt: Date;
}

const carnivalStallSchema = new Schema<ICarnivalStall>(
  {
    carnivalEventId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['game', 'stage_program'],
      required: true,
      default: 'game',
    },
    type: {
      type: String,
      enum: ['game', 'activity', 'stage_show', 'food', 'other'],
      required: true,
      default: 'game',
    },
    participationType: {
      type: String,
      enum: ['individual', 'group', 'both'],
      required: true,
      default: 'individual',
    },
    adminIds: {
      type: [String],
      required: true,
      default: [],
    },
    tokenCost: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    gameRules: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      minlength: 3,
      maxlength: 10, // Support up to 10 character codes
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      min: 0,
    },
    maxParticipants: {
      type: Number,
      min: 0,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
carnivalStallSchema.index({ carnivalEventId: 1, isActive: 1 });
carnivalStallSchema.index({ adminIds: 1 });
carnivalStallSchema.index({ category: 1 });

export const CarnivalStall = model<ICarnivalStall>('CarnivalStall', carnivalStallSchema);
