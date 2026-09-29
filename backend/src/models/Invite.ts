import { Schema, model } from 'mongoose';

const inviteSchema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  createdBy: { type: String, required: true, index: true },
  createdByName: { type: String, required: true },
  familyId: { type: String, required: true, index: true },
  familyName: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  relationshipNote: { type: String, trim: true, maxlength: 1000 },
  used: { type: Boolean, default: false, index: true },
  usedBy: { type: String },
  usedAt: { type: Date },
  revokedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, collection: 'invitetokens' });

export const Invite = model('Invite', inviteSchema);
