import { Schema, model } from 'mongoose';

export const RELATIONSHIP_TYPES = [
  'father', 'mother', 'son', 'daughter', 'child', 'brother', 'sister', 'spouse',
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];

export interface IRelationship {
  _id?: string;
  familyId: string;
  fromUserId: string;
  toUserId: string;
  type: RelationshipType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const relationshipSchema = new Schema<IRelationship>({
  familyId: { type: String, required: true, index: true },
  fromUserId: { type: String, required: true, index: true },
  toUserId: { type: String, required: true, index: true },
  type: { type: String, enum: RELATIONSHIP_TYPES, required: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });

relationshipSchema.index({ familyId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });

export const Relationship = model<IRelationship>('Relationship', relationshipSchema);
