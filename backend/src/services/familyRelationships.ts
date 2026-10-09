import { RelationshipType } from '../models/Relationship';

export interface RelationshipLink {
  _id?: string;
  familyId: string;
  fromUserId: string;
  toUserId: string;
  type: RelationshipType | string;
  createdBy?: string;
  legacy?: boolean;
  derived?: boolean;
}

export const reciprocalType = (type: RelationshipType, sourceGender?: string): RelationshipType => {
  const genderedSibling = sourceGender === 'female' ? 'sister' : 'brother';
  const inverse: Record<RelationshipType, RelationshipType> = {
    father: sourceGender === 'female' ? 'daughter' : 'son',
    mother: sourceGender === 'female' ? 'daughter' : 'son',
    son: sourceGender === 'female' ? 'mother' : 'father',
    daughter: sourceGender === 'female' ? 'mother' : 'father',
    child: sourceGender === 'female' ? 'mother' : 'father',
    brother: genderedSibling, sister: genderedSibling, spouse: 'spouse',
  };
  return inverse[type];
};

export const hasRelationshipPair = (links: RelationshipLink[], a: string, b: string) =>
  links.some(link => (String(link.fromUserId) === a && String(link.toUserId) === b) || (String(link.fromUserId) === b && String(link.toUserId) === a));

export const removeRelationshipPair = (links: RelationshipLink[], a: string, b: string) =>
  links.filter(link => !((String(link.fromUserId) === a && String(link.toUserId) === b) || (String(link.fromUserId) === b && String(link.toUserId) === a)));

const normalizedType = (type: string): string => type.toLowerCase();
const siblingTypes = new Set(['brother', 'sister', 'sibling']);

export const inferRelationship = (fromId: string, toId: string, users: any[], links: RelationshipLink[]) => {
  const byId = new Map(users.map(user => [String(user._id), user]));
  const source = byId.get(String(fromId));
  const target = byId.get(String(toId));
  if (!source || !target) return null;

  const direct = links.find(link => String(link.fromUserId) === String(fromId) && String(link.toUserId) === String(toId));
  if (direct) {
    const type = normalizedType(direct.type);
    if (type === 'parent') return { type: target.gender === 'female' ? 'mother' : 'father', derived: !!direct.derived, path: [source, target] };
    if (type === 'child') return { type: target.gender === 'female' ? 'daughter' : 'son', derived: !!direct.derived, path: [source, target] };
    return { type, derived: !!direct.derived, path: [source, target] };
  }

  const parents = new Map<string, Set<string>>();
  const children = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };
  for (const link of links) {
    const type = normalizedType(link.type);
    if (type === 'child') { add(children, String(link.fromUserId), String(link.toUserId)); add(parents, String(link.toUserId), String(link.fromUserId)); }
    if (type === 'son' || type === 'daughter') { add(children, String(link.fromUserId), String(link.toUserId)); add(parents, String(link.toUserId), String(link.fromUserId)); }
    if (type === 'parent' || type === 'father' || type === 'mother') { add(parents, String(link.fromUserId), String(link.toUserId)); add(children, String(link.toUserId), String(link.fromUserId)); }
  }
  // Existing user profile fields predate relationship records. Include them in the graph.
  for (const user of users) {
    const id = String(user._id);
    for (const parentId of [user.fatherId, user.motherId].filter(Boolean)) {
      add(parents, id, String(parentId)); add(children, String(parentId), id);
    }
    for (const childId of user.children || []) {
      add(children, id, String(childId)); add(parents, String(childId), id);
    }
  }
  const ancestors = (id: string) => {
    const result = new Map<string, number>();
    let layer = new Set(parents.get(id) || []), distance = 1;
    while (layer.size && distance <= users.length) {
      const next = new Set<string>();
      for (const current of layer) if (!result.has(current)) {
        result.set(current, distance);
        for (const parent of parents.get(current) || []) next.add(parent);
      }
      layer = next; distance++;
    }
    return result;
  };
  const sourceAncestors = ancestors(String(fromId));
  const targetAncestors = ancestors(String(toId));
  const ancestorPath = (startId: string, ancestorId: string) => {
    const result = [byId.get(startId)!];
    let current = startId;
    const visited = new Set<string>();
    while (current !== ancestorId && !visited.has(current)) {
      visited.add(current);
      const next = [...(parents.get(current) || [])].find(parentId => parentId === ancestorId || ancestors(parentId).has(ancestorId));
      if (!next) break;
      current = next;
      const member = byId.get(current);
      if (member) result.push(member);
    }
    return result;
  };
  const sourceDistance = sourceAncestors.get(String(toId));
  if (sourceDistance) return { type: sourceDistance === 1 ? 'parent' : 'grandparent', derived: true, path: ancestorPath(String(fromId), String(toId)) };
  const targetDistance = targetAncestors.get(String(fromId));
  if (targetDistance) return { type: targetDistance === 1 ? 'child' : 'grandchild', derived: true, path: ancestorPath(String(toId), String(fromId)).reverse() };

  const isSibling = (a: string, b: string) => {
    if ([...(parents.get(a) || [])].some(parent => parents.get(b)?.has(parent))) return true;
    return links.some(link => String(link.fromUserId) === a && String(link.toUserId) === b && siblingTypes.has(normalizedType(link.type)));
  };
  const genderedSibling = target.gender === 'male' ? 'brother' : target.gender === 'female' ? 'sister' : 'sibling';
  const sourceParents = parents.get(String(fromId)) || new Set<string>();
  const targetParents = parents.get(String(toId)) || new Set<string>();
  if (isSibling(String(fromId), String(toId))) return { type: genderedSibling, derived: true, path: [source, target] };

  const auntParent = [...sourceParents].find(parentId => isSibling(parentId, String(toId)));
  if (auntParent) {
    return { type: target.gender === 'female' ? 'aunt' : 'uncle', derived: true, path: [source, byId.get(auntParent), target].filter(Boolean) };
  }
  const nieceParent = [...targetParents].find(parentId => isSibling(String(fromId), parentId));
  if (nieceParent) {
    return { type: target.gender === 'female' ? 'niece' : target.gender === 'male' ? 'nephew' : 'nibling', derived: true, path: [source, byId.get(nieceParent), target].filter(Boolean) };
  }
  const cousinParents = [...sourceParents].flatMap(a => [...targetParents].filter(b => isSibling(a, b)).map(b => [a, b]));
  if (cousinParents.length) {
    const [a, b] = cousinParents[0];
    return { type: 'cousin', derived: true, path: [source, byId.get(a), byId.get(b), target].filter(Boolean) };
  }
  return null;
};

export const formatRelationship = (type: string): string => ({
  parent: 'Parent', father: 'Father', mother: 'Mother', son: 'Son', daughter: 'Daughter', child: 'Child', brother: 'Brother', sister: 'Sister', sibling: 'Sibling', spouse: 'Spouse',
  grandparent: 'Grandparent', grandchild: 'Grandchild', uncle: 'Uncle', aunt: 'Aunt', nephew: 'Nephew', niece: 'Niece', cousin: 'Cousin',
}[type] || type);
