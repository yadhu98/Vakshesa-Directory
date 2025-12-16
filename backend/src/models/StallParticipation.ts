import { Schema, model } from 'mongoose';

export type ParticipationStatus = 'pending' | 'completed' | 'cancelled';

export interface IStallParticipation {
  _id?: string;
  stallId: string; // Reference to CarnivalStall
  carnivalEventId: string; // Reference to main Event
  participantId: string; // User who participated
  adminIds: string[]; // Event admins
  tokensPaid: number; // Tokens deducted
  pointsAwarded: number; // Points given by admin
  status: ParticipationStatus;
  participatedAt: Date;
  pointsAwardedAt?: Date;
  notes?: string; // Admin's notes
  // Stage program specific fields
  isStageProgram: boolean;
  participantName?: string; // For stage programs
  participantDetails?: string;
  performance?: string; // What they're performing
  groupMembers?: string[]; // For group performances
  numberOfParticipants?: number; // Number of participants in the group
  createdAt: Date;
  updatedAt: Date;
}

const stallParticipationSchema = new Schema<IStallParticipation>(
  {
    stallId: {
      type: String,
      required: true,
      index: true,
    },
    carnivalEventId: {
      type: String,
      required: true,
      index: true,
    },
    participantId: {
      type: String,
      required: true,
      index: true,
    },
    adminIds: {
      type: [String],
      required: true,
      default: [],
    },
    tokensPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    participatedAt: {
      type: Date,
      default: Date.now,
    },
    pointsAwardedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    isStageProgram: {
      type: Boolean,
      default: false,
    },
    participantName: {
      type: String,
      trim: true,
    },
    participantDetails: {
      type: String,
      trim: true,
    },
    performance: {
      type: String,
      trim: true,
    },
    groupMembers: {
      type: [String],
      default: [],
    },
    numberOfParticipants: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
stallParticipationSchema.index({ stallId: 1, participantId: 1 });
stallParticipationSchema.index({ carnivalEventId: 1, participantId: 1 });
stallParticipationSchema.index({ adminIds: 1, status: 1 });
stallParticipationSchema.index({ participantId: 1, status: 1 });

export const StallParticipation = model<IStallParticipation>('StallParticipation', stallParticipationSchema);
