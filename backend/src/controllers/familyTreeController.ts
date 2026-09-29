import { Response } from 'express';
import { db } from '../config/storage';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUserForViewer } from '../services/profilePrivacy';

const isApprovedMember = (user: any, familyId?: string) => !!user && user.familyId === familyId && user.isActive !== false && user.membershipStatus === 'Approved';

export const getFamilyTree = async (req: AuthRequest, res: Response) => {
  try {
    const { familyId } = req.params;
    if (familyId !== req.user?.familyId) return res.status(403).json({ message: 'You can only access your own family directory' });
    const house = typeof req.query.house === 'string' ? req.query.house : undefined;
    const users = (await db.find('users', { familyId }))
      .filter((user: any) => !user.isSuperUser && user.isActive !== false && user.membershipStatus === 'Approved' && (!house || user.house === house))
      .map((user: any) => sanitizeUserForViewer(user, String(req.user?.id)));
    res.json({ familyId, house: house || 'all', totalMembers: users.length, totalGenerations: users.length ? Math.max(...users.map((user: any) => user.generation || 1)) : 0, tree: buildTreeStructure(users) });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch family tree', error: error.message });
  }
};

export const getFamilyMember = async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.findById('users', req.params.userId);
    if (!isApprovedMember(user, req.user?.familyId)) return res.status(404).json({ message: 'User not found' });
    res.json({ member: sanitizeUserForViewer(user, String(req.user?.id)), ...await getImmediateFamily(user, req.user?.familyId, String(req.user?.id)) });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch family member', error: error.message });
  }
};

export const updateFamilyRelationships = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await db.findById('users', userId);
    if (!isApprovedMember(user, req.user?.familyId)) return res.status(404).json({ message: 'Family member not found' });
    if (!user) return res.status(404).json({ message: 'Family member not found' });
    const { fatherId, motherId, spouseId, children } = req.body;
    const updates: Record<string, any> = {};
    const validRelatedUser = async (id: string) => isApprovedMember(await db.findById('users', id), user.familyId);

    for (const [field, id] of [['fatherId', fatherId], ['motherId', motherId], ['spouseId', spouseId]] as const) {
      if (id === undefined) continue;
      if (id && !(await validRelatedUser(id))) return res.status(400).json({ message: `${field} must refer to an approved member of this family` });
      updates[field] = id || null;
    }
    if (children !== undefined) {
      if (!Array.isArray(children)) return res.status(400).json({ message: 'children must be an array' });
      for (const childId of children) if (!(await validRelatedUser(childId))) return res.status(400).json({ message: 'Children must be approved members of this family' });
      updates.children = children;
    }
    for (const field of ['fatherId', 'motherId'] as const) {
      if (updates[field] === undefined) continue;
      const previousId = user[field];
      const nextId = updates[field];
      if (previousId && previousId !== nextId) {
        const previous = await db.findById('users', previousId);
        if (previous && previous.familyId === user.familyId) {
          await db.update('users', previousId, { children: (previous.children || []).filter((id: string) => String(id) !== String(userId)) });
        }
      }
      if (nextId) {
        const parent = await db.findById('users', nextId);
        if (!parent) return res.status(400).json({ message: 'Parent must be an approved member of this family' });
        const childIds = (parent.children || []).map(String);
        if (!childIds.includes(String(userId))) await db.update('users', nextId, { children: [...childIds, String(userId)] });
      }
    }
    if (updates.spouseId !== undefined) {
      if (user.spouseId && user.spouseId !== updates.spouseId) {
        const previousSpouse = await db.findById('users', user.spouseId);
        if (previousSpouse && previousSpouse.familyId === user.familyId) await db.update('users', user.spouseId, { spouseId: null });
      }
      if (updates.spouseId) await db.update('users', updates.spouseId, { spouseId: String(userId) });
    }
    const parentId = updates.fatherId || updates.motherId;
    if (parentId) {
      const parent = await db.findById('users', parentId);
      if (!parent) return res.status(400).json({ message: 'Parent must be an approved member of this family' });
      updates.generation = (parent.generation || 1) + 1;
    }
    await db.updateOne('users', { _id: userId }, updates);
    const updatedUser = await db.findById('users', userId);
    res.json({ message: 'Family relationships updated successfully', member: sanitizeUserForViewer(updatedUser, String(req.user?.id)), ...await getImmediateFamily(updatedUser, user.familyId, String(req.user?.id)) });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update relationships', error: error.message });
  }
};

export const getGenerationMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { familyId, generation } = req.params;
    if (familyId !== req.user?.familyId) return res.status(403).json({ message: 'You can only access your own family directory' });
    const members = (await db.find('users', { familyId, generation: parseInt(generation, 10) }))
      .filter((user: any) => user.isActive !== false && user.membershipStatus === 'Approved')
      .map((user: any) => sanitizeUserForViewer(user, String(req.user?.id)));
    res.json({ generation: parseInt(generation, 10), totalMembers: members.length, members });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch generation members', error: error.message });
  }
};

export const searchForRelatives = async (req: AuthRequest, res: Response) => {
  try {
    const { q, excludeId, relationshipType } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query required' });
    const searchTerm = String(q).trim().toLowerCase();
    let results = (await db.find('users', { familyId: req.user?.familyId }))
      .filter((user: any) => isApprovedMember(user, req.user?.familyId) && String(user._id) !== String(excludeId || ''))
      .map((user: any) => sanitizeUserForViewer(user, String(req.user?.id)))
      .filter((user: any) => `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm));
    if (relationshipType === 'father') results = results.filter((user: any) => user.gender === 'male');
    if (relationshipType === 'mother') results = results.filter((user: any) => user.gender === 'female');
    results = results.slice(0, 20);
    res.json({ query: q, count: results.length, results });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to search relatives', error: error.message });
  }
};

export const getMemberPath = async (req: AuthRequest, res: Response) => {
  try {
    const path: any[] = [];
    let currentUser = await db.findById('users', req.params.userId);
    if (!isApprovedMember(currentUser, req.user?.familyId)) return res.status(404).json({ message: 'User not found' });
    while (currentUser && isApprovedMember(currentUser, req.user?.familyId)) {
      const profile = sanitizeUserForViewer(currentUser, String(req.user?.id));
      path.unshift({ _id: currentUser._id, firstName: profile.firstName, lastName: profile.lastName, generation: profile.generation });
      const parentId = currentUser.fatherId || currentUser.motherId;
      currentUser = parentId ? await db.findById('users', parentId) : null;
    }
    res.json({ userId: req.params.userId, path, totalGenerations: path.length });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get member path', error: error.message });
  }
};

function buildTreeStructure(users: any[]) {
  const nodeMap = new Map<string, any>();
  users.forEach((user) => nodeMap.set(String(user._id), { ...user, children: [], spouses: [] }));
  for (const user of users) {
    const node = nodeMap.get(String(user._id));
    for (const parentId of [user.fatherId, user.motherId]) {
      const parent = parentId && nodeMap.get(String(parentId));
      if (parent && !parent.children.some((child: any) => String(child._id) === String(user._id))) parent.children.push(node);
    }
    const spouse = user.spouseId && nodeMap.get(String(user.spouseId));
    if (spouse && !node.spouses.some((entry: any) => String(entry._id) === String(spouse._id))) node.spouses.push(spouse);
  }
  const parented = new Set<string>();
  for (const user of users) {
    if ((user.fatherId && nodeMap.has(String(user.fatherId))) || (user.motherId && nodeMap.has(String(user.motherId)))) parented.add(String(user._id));
  }
  const roots = users.filter((user) => !parented.has(String(user._id))).map((user) => nodeMap.get(String(user._id)));
  return roots.length ? roots : users.map((user) => nodeMap.get(String(user._id)));
}

async function getImmediateFamily(user: any, familyId?: string, viewerId = '') {
  const load = async (id?: string) => {
    if (!id) return null;
    const member = await db.findById('users', String(id));
    return isApprovedMember(member, familyId) ? member : null;
  };
  const father = await load(user.fatherId);
  const mother = await load(user.motherId);
  const spouse = await load(user.spouseId);
  const children = (await Promise.all((user.children || []).map((id: string) => load(id)))).filter(Boolean);
  const parent = father || mother;
  const siblings: any[] = [];
  if (parent?.children) {
    for (const siblingId of parent.children) {
      if (String(siblingId) !== String(user._id)) {
        const sibling = await load(siblingId);
        if (sibling) siblings.push(sibling);
      }
    }
  }
  const safe = (member: any) => member ? sanitizeUserForViewer(member, viewerId) : null;
  return { father: safe(father), mother: safe(mother), spouse: safe(spouse), children: children.map(safe), siblings: siblings.map(safe) };
}
