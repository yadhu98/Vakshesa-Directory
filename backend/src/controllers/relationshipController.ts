import { Response } from 'express';
import { db } from '../config/storage';
import { RelationshipType } from '../models/Relationship';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUserForViewer } from '../services/profilePrivacy';
import { formatRelationship, hasRelationshipPair, inferRelationship, reciprocalType, RelationshipLink } from '../services/familyRelationships';
import { recordAuditEvent } from '../services/auditService';
import { hasApprovedMembership } from '../services/membership';

const approved = (user: any, familyId: string) => !!user && String(user.familyId) === String(familyId) && user.isActive !== false && hasApprovedMembership(user) && !user.isSuperUser;

const familyGraph = async (familyId: string) => {
  const users = (await db.find('users', { familyId })).filter(user => approved(user, familyId));
  const links: RelationshipLink[] = await db.find('relationships', { familyId }) as RelationshipLink[];
  const seen = new Set(links.map(link => `${link.fromUserId}:${link.toUserId}`));
  const addLegacy = (fromUserId: string, toUserId: string, type: string) => {
    if (!toUserId || !users.some(user => String(user._id) === String(toUserId))) return;
    const key = `${fromUserId}:${toUserId}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ _id: `legacy-${fromUserId}-${toUserId}`, familyId, fromUserId, toUserId, type, legacy: true });
  };
  for (const node of await db.find('familyNodes', { familyId })) {
    if (node.parentId && users.some(user => String(user._id) === String(node.parentId)) && users.some(user => String(user._id) === String(node.userId))) {
      addLegacy(String(node.parentId), String(node.userId), 'child');
      addLegacy(String(node.userId), String(node.parentId), 'parent');
    }
  }
  for (const user of users) {
    const id = String(user._id);
    for (const parentId of [user.fatherId, user.motherId].filter(Boolean)) {
      addLegacy(id, String(parentId), 'parent');
      addLegacy(String(parentId), id, 'child');
    }
    for (const childId of user.children || []) {
      addLegacy(id, String(childId), 'child');
      addLegacy(String(childId), id, 'parent');
    }
    if (user.spouseId) {
      addLegacy(id, String(user.spouseId), 'spouse');
      addLegacy(String(user.spouseId), id, 'spouse');
    }
  }
  return { users, links };
};

export const getRelationshipProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const familyId = String(req.user?.familyId || '');
    const member = await db.findById('users', userId);
    if (!approved(member, familyId)) return res.status(404).json({ message: 'Family member not found' });
    const { users, links } = await familyGraph(familyId);
    const relationships = users.filter(user => String(user._id) !== userId).flatMap(other => {
      const inferred = inferRelationship(userId, String(other._id), users, links);
      return inferred ? [{
        _id: links.find(link => String(link.fromUserId) === userId && String(link.toUserId) === String(other._id))?._id ||
          links.find(link => String(link.fromUserId) === String(other._id) && String(link.toUserId) === userId)?._id ||
          `derived-${userId}-${other._id}`,
        user: sanitizeUserForViewer(other, String(req.user?.id)),
        type: inferred.type,
        label: formatRelationship(inferred.type),
        derived: !!inferred.derived,
      }] : [];
    });
    res.json({ member: sanitizeUserForViewer(member, String(req.user?.id)), relationships });
  } catch (error: any) {
    res.status(500).json({ message: 'Could not load family relationships', error: error.message });
  }
};

export const createRelationship = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = String(req.user?.familyId || '');
    const admin = req.user?.role === 'admin' || req.user?.isSuperUser;
    const fromUserId = String(admin && req.body.sourceUserId ? req.body.sourceUserId : req.user?.id || '');
    const toUserId = String(req.body.targetUserId || '');
    const type = String(req.body.type || '').toLowerCase() as RelationshipType;
    if (!(['father', 'mother', 'son', 'daughter', 'brother', 'sister', 'spouse'] as RelationshipType[]).includes(type)) return res.status(400).json({ message: 'Choose a supported relationship type' });
    if (!fromUserId || !toUserId || fromUserId === toUserId) return res.status(400).json({ message: 'Choose another family member' });
    if (!admin && fromUserId !== String(req.user?.id)) return res.status(403).json({ message: 'You can only add relationships to your own profile' });
    const source = await db.findById('users', fromUserId);
    const target = await db.findById('users', toUserId);
    if (!source || !target || !approved(source, familyId) || !approved(target, familyId)) return res.status(404).json({ message: 'Both people must be active, approved members of your family' });
    if ((type === 'son' && target.gender === 'female') || (type === 'daughter' && target.gender === 'male')) {
      return res.status(400).json({ message: 'Choose Son or Daughter to match the selected member’s gender' });
    }
    const { users, links } = await familyGraph(familyId);
    const exists = hasRelationshipPair(links, fromUserId, toUserId);
    if (exists) return res.status(409).json({ message: 'A relationship between these members already exists' });
    if (type === 'father' || type === 'mother') {
      const profileParentId = type === 'father' ? source.fatherId : source.motherId;
      const alreadyHasParent = !!profileParentId || links.some(link =>
        String(link.fromUserId) === fromUserId &&
        (String(link.type).toLowerCase() === type || (String(link.type).toLowerCase() === 'parent' &&
          users.find(user => String(user._id) === String(link.toUserId))?.gender === (type === 'father' ? 'male' : 'female'))),
      );
      if (alreadyHasParent) return res.status(409).json({ message: `A ${type} relationship is already set for this person` });
    }
    if (type === 'son' || type === 'daughter') {
      const reverseType = inferRelationship(toUserId, fromUserId, users, links)?.type;
      if (['father', 'mother', 'parent', 'grandparent', 'grandchild', 'son', 'daughter', 'child'].includes(String(reverseType))) {
        return res.status(409).json({ message: 'This parent relationship would create a family tree cycle' });
      }
    }
    if (type === 'spouse' && (source.spouseId || links.some(link =>
      String(link.type).toLowerCase() === 'spouse' &&
      (String(link.fromUserId) === fromUserId || String(link.toUserId) === fromUserId || String(link.fromUserId) === toUserId || String(link.toUserId) === toUserId),
    ))) return res.status(409).json({ message: 'One of these people already has a spouse relationship' });
    if (type === 'father' || type === 'mother') {
      const reverseType = inferRelationship(toUserId, fromUserId, users, links)?.type;
      const wouldCycle = ['parent', 'father', 'mother', 'son', 'daughter', 'child'].includes(String(reverseType));
      if (wouldCycle) return res.status(409).json({ message: 'This parent relationship would create a family tree cycle' });
    }
    const inverse = reciprocalType(type, source.gender);
    const createdBy = String(req.user?.id || '');
    const forward = await db.create('relationships', { familyId, fromUserId, toUserId, type, createdBy });
    try {
      await db.create('relationships', { familyId, fromUserId: toUserId, toUserId: fromUserId, type: inverse, createdBy });
    } catch (error) {
      await db.deleteOne('relationships', { _id: forward._id });
      throw error;
    }
    await recordAuditEvent(createdBy, String(req.user?.role), admin && fromUserId !== createdBy ? 'family_relationship_admin_added' : 'family_relationship_added', toUserId, { familyId, sourceUserId: fromUserId, targetUserId: toUserId, type });
    res.status(201).json({ message: 'Family relationship added', relationship: forward });
  } catch (error: any) {
    res.status(error?.code === 11000 ? 409 : 500).json({ message: error?.code === 11000 ? 'This relationship already exists' : 'Could not add family relationship', error: error.message });
  }
};

export const deleteRelationship = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = String(req.user?.familyId || '');
    const { users, links } = await familyGraph(familyId);
    const link = links.find(item => String(item._id) === String(req.params.relationshipId));
    if (!link) return res.status(404).json({ message: 'Relationship not found' });
    const admin = req.user?.role === 'admin' || req.user?.isSuperUser;
    const actorId = String(req.user?.id || '');
    if (!admin && actorId !== String(link.fromUserId) && actorId !== String(link.toUserId)) return res.status(403).json({ message: 'You can only remove relationships involving you' });
    const source = users.find(user => String(user._id) === String(link.fromUserId));
    const target = users.find(user => String(user._id) === String(link.toUserId));
    if (source && (String(source.fatherId) === String(link.toUserId) || String(source.motherId) === String(link.toUserId))) {
      const update: any = {};
      if (String(source.fatherId) === String(link.toUserId)) update.fatherId = null;
      if (String(source.motherId) === String(link.toUserId)) update.motherId = null;
      await db.update('users', String(source._id), update);
    }
    if (source && (source.children || []).map(String).includes(String(link.toUserId))) await db.update('users', String(source._id), { children: source.children.filter((id: string) => String(id) !== String(link.toUserId)) });
    if (source && String(source.spouseId) === String(link.toUserId)) await db.update('users', String(source._id), { spouseId: null });
    if (target && (String(target.fatherId) === String(link.fromUserId) || String(target.motherId) === String(link.fromUserId))) {
      const update: any = {};
      if (String(target.fatherId) === String(link.fromUserId)) update.fatherId = null;
      if (String(target.motherId) === String(link.fromUserId)) update.motherId = null;
      await db.update('users', String(target._id), update);
    }
    if (target && (target.children || []).map(String).includes(String(link.fromUserId))) await db.update('users', String(target._id), { children: target.children.filter((id: string) => String(id) !== String(link.fromUserId)) });
    if (target && String(target.spouseId) === String(link.fromUserId)) await db.update('users', String(target._id), { spouseId: null });
    if (['parent', 'father', 'mother', 'child', 'son', 'daughter'].includes(String(link.type).toLowerCase())) {
      const parentToChild = ['child', 'son', 'daughter'].includes(String(link.type).toLowerCase());
      const childId = parentToChild ? String(link.toUserId) : String(link.fromUserId);
      const parentId = parentToChild ? String(link.fromUserId) : String(link.toUserId);
      await db.deleteMany('familyNodes', { familyId, userId: childId, parentId });
    }
    await db.deleteOne('relationships', { familyId, fromUserId: link.fromUserId, toUserId: link.toUserId });
    await db.deleteOne('relationships', { familyId, fromUserId: link.toUserId, toUserId: link.fromUserId });
    await recordAuditEvent(actorId, String(req.user?.role), admin ? 'family_relationship_admin_removed' : 'family_relationship_removed', link.toUserId, { familyId, sourceUserId: link.fromUserId, targetUserId: link.toUserId, type: link.type });
    res.json({ message: 'Relationship removed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Could not remove family relationship', error: error.message });
  }
};

export const getFamilyRelationshipTree = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = String(req.user?.familyId || '');
    const { users, links } = await familyGraph(familyId);
    const safeUsers = users.map(user => sanitizeUserForViewer(user, String(req.user?.id)));
    const safeLinks = links.map(({ _id, fromUserId, toUserId, type, legacy }) => ({ _id, fromUserId, toUserId, type, legacy: !!legacy }));
    res.json({ familyId, members: safeUsers, relationships: safeLinks });
  } catch (error: any) {
    res.status(500).json({ message: 'Could not load family tree', error: error.message });
  }
};

export const howRelated = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = String(req.user?.familyId || '');
    const admin = req.user?.role === 'admin' || req.user?.isSuperUser;
    const fromUserId = String(admin && req.query.sourceUserId ? req.query.sourceUserId : req.user?.id || '');
    const toUserId = String(req.query.targetUserId || '');
    const { users, links } = await familyGraph(familyId);
    if (!users.some(user => String(user._id) === fromUserId) || !users.some(user => String(user._id) === toUserId)) return res.status(404).json({ message: 'Member not found' });
    const result = inferRelationship(fromUserId, toUserId, users, links);
    if (!result) return res.json({ related: false, message: 'Relationship could not be determined from the available family information.' });
    const plural = (type: string) => ({ parent: 'your parent', father: 'your father', mother: 'your mother', son: 'your son', daughter: 'your daughter', child: 'your child', brother: 'your brother', sister: 'your sister', sibling: 'your sibling', spouse: 'your spouse', grandparent: 'your grandparent', grandchild: 'your grandchild', aunt: 'your aunt', uncle: 'your uncle', niece: 'your niece', nephew: 'your nephew', cousin: 'your first cousin' }[type] || `your ${type}`);
    const target = users.find(user => String(user._id) === toUserId)!;
    const name = `${target.firstName || ''} ${target.lastName || ''}`.trim();
    const path = result.path.map((member: any, index: number) => index === 0 ? 'You' : `${member.firstName || ''} ${member.lastName || ''}`.trim());
    res.json({ related: true, type: result.type, label: `${name} is ${plural(result.type)}.`, derived: !!result.derived, path });
  } catch (error: any) {
    res.status(500).json({ message: 'Could not determine relationship', error: error.message });
  }
};

export const getRelationshipHistory = async (req: AuthRequest, res: Response) => {
  try {
    const events = await db.find('auditEvents', { familyId: String(req.user?.familyId || '') });
    res.json({ history: events.filter(event => String(event.action || '').startsWith('family_relationship_')).sort((a, b) => new Date(b.occurredAt || b.createdAt).getTime() - new Date(a.occurredAt || a.createdAt).getTime()).slice(0, 200) });
  } catch (error: any) {
    res.status(500).json({ message: 'Could not load relationship history', error: error.message });
  }
};
