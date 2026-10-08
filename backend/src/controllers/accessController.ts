import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/storage';
import { recordAuditEvent } from '../services/auditService';
import { sanitizeUserForViewer } from '../services/profilePrivacy';
import { wsService } from '../services/websocket';
import { hashPassword } from '../utils/auth';

const applicantView = (user: any) => {
  if (!user) return null;
  const { password, privacySettings, isSuperUser, ...submittedProfile } = user;
  return submittedProfile;
};

export const listRegistrationRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';
    if (!['all', 'Pending', 'Approved', 'Rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be Pending, Approved, Rejected, or all' });
      return;
    }
    const requests = await db.find('registrationRequests', { familyId: req.user?.familyId });
    const filtered = requests
      .filter((item: any) => status === 'all' || item.status === status)
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const results = await Promise.all(filtered.map(async (item: any) => {
      const user = await db.findById('users', String(item.userId));
      const inviter = await db.findById('users', String(item.invitedBy));
      const reviewer = item.reviewedBy ? await db.findById('users', String(item.reviewedBy)) : null;
      const invite = item.inviteId ? await db.findById('inviteTokens', String(item.inviteId)) : null;
      return {
        id: item._id,
        status: item.status,
        submittedAt: item.submittedAt,
        reviewedAt: item.reviewedAt,
        reviewedBy: reviewer ? { id: reviewer._id, name: `${reviewer.firstName} ${reviewer.lastName}`.trim() } : null,
        rejectionReason: item.rejectionReason,
        relationshipNote: item.relationshipNote || invite?.relationshipNote || null,
        invitedBy: inviter ? {
          id: inviter._id,
          name: `${inviter.firstName} ${inviter.lastName}`.trim(),
          house: item.inviterHouse || inviter.house || invite?.createdByHouse || null,
        } : null,
        applicant: applicantView(user),
      };
    }));
    res.json({ requests: results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewRegistrationRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const action = req.params.action;
    if (action !== 'approve' && action !== 'reject') {
      res.status(404).json({ message: 'Unknown review action' });
      return;
    }
    const request = await db.findById('registrationRequests', req.params.requestId);
    if (!request || request.familyId !== req.user?.familyId) {
      res.status(404).json({ message: 'Registration request not found' });
      return;
    }
    if (request.status !== 'Pending') {
      res.status(409).json({ message: 'This request has already been reviewed', status: request.status });
      return;
    }
    const user = await db.findById('users', String(request.userId));
    if (!user || user.membershipStatus !== 'Pending') {
      res.status(409).json({ message: 'The applicant account is no longer pending' });
      return;
    }

    const rejectionReason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    const nextStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const reviewedAt = new Date();
    const updatedRequest = await db.updateOne('registrationRequests', { _id: request._id, status: 'Pending' }, {
      status: nextStatus,
      reviewedBy: req.user?.id,
      reviewedAt,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
    });
    if (!updatedRequest) {
      res.status(409).json({ message: 'This request has already been reviewed' });
      return;
    }
    const updatedUser = await db.updateOne('users', { _id: user._id, membershipStatus: 'Pending' }, {
      membershipStatus: nextStatus,
      membershipReviewedBy: req.user?.id,
      membershipReviewedAt: reviewedAt,
      membershipRejectionReason: action === 'reject' ? rejectionReason : '',
    });
    if (!updatedUser) {
      await db.updateOne('registrationRequests', { _id: request._id, status: nextStatus, reviewedBy: req.user?.id }, {
        status: 'Pending',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      });
      res.status(409).json({ message: 'Applicant status changed before review completed' });
      return;
    }
    await recordAuditEvent(String(req.user?.id), String(req.user?.role), action === 'approve' ? 'registration_approved' : 'registration_rejected', String(user._id), {
      familyId: request.familyId,
      requestId: String(request._id),
      ...(action === 'reject' && rejectionReason ? { reason: rejectionReason } : {}),
    });
    res.json({ message: action === 'approve' ? 'Registration approved' : 'Registration rejected', status: nextStatus, reviewedAt });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listFamilyAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await db.find('users', { familyId: req.user?.familyId, role: 'admin' });
    const approved = users.filter((user: any) => user.isActive !== false && user.membershipStatus === 'Approved');
    res.json({ admins: approved.map((user: any) => sanitizeUserForViewer(user, String(req.user?.id))) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changeFamilyAdminRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.body.role;
    if (role !== 'admin' && role !== 'user') {
      res.status(400).json({ message: 'Role must be admin or user' });
      return;
    }
    const target = await db.findById('users', req.params.userId);
    if (!target || target.familyId !== req.user?.familyId) {
      res.status(404).json({ message: 'Family member not found' });
      return;
    }
    if (target.membershipStatus !== 'Approved' || target.isActive === false) {
      res.status(409).json({ message: 'Only active, approved members can be made an admin' });
      return;
    }
    if (target.isSuperUser && role === 'user') {
      res.status(403).json({ message: 'The primary super admin cannot be demoted here' });
      return;
    }
    if (target.role === role) {
      res.status(409).json({ message: `This member is already ${role === 'admin' ? 'an admin' : 'a regular member'}` });
      return;
    }
    if (role === 'user' && String(target._id) === String(req.user?.id)) {
      const admins = await db.find('users', { familyId: req.user?.familyId, role: 'admin' });
      const activeAdminCount = admins.filter((item: any) => item.isActive !== false && item.membershipStatus === 'Approved').length;
      if (activeAdminCount <= 1) {
        res.status(409).json({ message: 'You cannot remove the last remaining family admin' });
        return;
      }
    }
    const updated = await db.updateOne('users', { _id: target._id, role: target.role }, {
      role,
      adminChangedBy: req.user?.id,
      adminChangedAt: new Date(),
    });
    if (!updated) {
      res.status(409).json({ message: 'Member access changed before this request completed' });
      return;
    }
    wsService.disconnectUser(String(target._id));
    await recordAuditEvent(String(req.user?.id), String(req.user?.role), role === 'admin' ? 'admin_promoted' : 'admin_revoked', String(target._id), {
      familyId: target.familyId,
      previousRole: target.role,
      role,
    });
    res.json({ message: role === 'admin' ? 'Member promoted to admin' : 'Admin privileges revoked' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetFamilyMemberPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const target = await db.findById('users', req.params.userId);
    if (!target || target.familyId !== req.user?.familyId) {
      res.status(404).json({ message: 'Family member not found' });
      return;
    }
    if (target.isSuperUser) {
      res.status(403).json({ message: 'The primary super admin password cannot be reset here' });
      return;
    }
    const DEFAULT_RESET_PASSWORD = 'Password123';
    const hashedPassword = await hashPassword(DEFAULT_RESET_PASSWORD);
    const updated = await db.updateOne('users', { _id: target._id }, {
      password: hashedPassword,
      passwordResetBy: req.user?.id,
      passwordResetAt: new Date(),
    });
    if (!updated) {
      res.status(409).json({ message: 'Member record changed before this request completed' });
      return;
    }
    wsService.disconnectUser(String(target._id));
    await recordAuditEvent(String(req.user?.id), String(req.user?.role), 'password_reset', String(target._id), {
      familyId: target.familyId,
    });
    res.json({ message: `Password has been reset to ${DEFAULT_RESET_PASSWORD}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listFamilyAuditEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await db.find('auditEvents', { familyId: req.user?.familyId });
    const ordered = events
      .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 200);
    const results = await Promise.all(ordered.map(async (event: any) => {
      const actor = await db.findById('users', String(event.actorId));
      const target = event.targetUserId ? await db.findById('users', String(event.targetUserId)) : null;
      return {
        id: event._id,
        who: actor
          ? `${sanitizeUserForViewer(actor, String(req.user?.id)).firstName || ''} ${sanitizeUserForViewer(actor, String(req.user?.id)).lastName || ''}`.trim() || 'Family member'
          : 'Former member',
        actorRole: event.actorRole,
        what: event.action,
        when: event.occurredAt,
        affectedUser: target
          ? {
              id: target._id,
              name: `${sanitizeUserForViewer(target, String(req.user?.id)).firstName || ''} ${sanitizeUserForViewer(target, String(req.user?.id)).lastName || ''}`.trim() || 'Family member',
            }
          : event.details?.invitedEmail ? { id: null, name: event.details.invitedEmail } : null,
        details: event.details,
      };
    }));
    res.json({ events: results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
