import { Schema, model } from 'mongoose';

const registrationRequestSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  inviteId: { type: String, required: true, unique: true, index: true },
  familyId: { type: String, required: true, index: true },
  invitedBy: { type: String, required: true },
  relationshipNote: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

export const RegistrationRequest = model('RegistrationRequest', registrationRequestSchema);
