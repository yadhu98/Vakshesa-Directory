import { Schema, model } from 'mongoose';

const auditEventSchema = new Schema({
  actorId: { type: String, required: true, index: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  targetUserId: { type: String, index: true },
  familyId: { type: String, index: true },
  details: { type: Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

export const AuditEvent = model('AuditEvent', auditEventSchema);
