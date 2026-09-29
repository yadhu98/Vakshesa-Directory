import { db } from '../config/storage';

export const recordAuditEvent = async (
  actorId: string,
  actorRole: string,
  action: string,
  targetUserId?: string,
  details: Record<string, unknown> = {},
) => db.create('auditEvents', {
  actorId,
  actorRole,
  action,
  targetUserId,
  familyId: typeof details.familyId === 'string' ? details.familyId : undefined,
  details,
  occurredAt: new Date(),
});
