export interface FamilyTreeLink {
  fromUserId: string;
  toUserId: string;
  type: string;
}

export const findRelationshipPath = (
  fromUserId: string,
  toUserId: string,
  members: any[],
  links: FamilyTreeLink[],
) => {
  const from = String(fromUserId);
  const to = String(toUserId);
  if (!from || !to || from === to) return null;
  const adjacency = new Map<string, Set<string>>();
  const addNeighbor = (userId: string, neighborId: string) => {
    if (!adjacency.has(userId)) adjacency.set(userId, new Set());
    adjacency.get(userId)!.add(neighborId);
  };
  links.forEach(link => {
    const a = String(link.fromUserId);
    const b = String(link.toUserId);
    addNeighbor(a, b);
    addNeighbor(b, a);
  });

  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length && !previous.has(to)) {
    const current = queue.shift()!;
    (adjacency.get(current) || new Set<string>()).forEach(next => {
      if (previous.has(next)) return;
      previous.set(next, current);
      queue.push(next);
    });
  }
  if (!previous.has(to)) return null;

  const userIds = [to];
  while (userIds[0] !== from) userIds.unshift(previous.get(userIds[0])!);
  const relationships = userIds.slice(1).map((targetId, index) => {
    const sourceId = userIds[index];
    const direct = links.find(link => String(link.fromUserId) === sourceId && String(link.toUserId) === targetId);
    if (direct) return { fromUserId: sourceId, toUserId: targetId, type: direct.type };
    const reverseType = String(links.find(link => String(link.fromUserId) === targetId && String(link.toUserId) === sourceId)?.type || '').toLowerCase();
    const target = members.find(member => String(member._id) === targetId);
    const targetGender = String(target?.gender || '').toLowerCase();
    const inverseType = reverseType === 'parent' ? 'child' : reverseType === 'child' ? 'parent'
      : reverseType === 'father' || reverseType === 'mother' ? (targetGender === 'female' ? 'daughter' : 'son')
        : reverseType === 'son' || reverseType === 'daughter' ? (targetGender === 'female' ? 'mother' : 'father')
          : reverseType === 'brother' || reverseType === 'sister' ? (targetGender === 'female' ? 'sister' : 'brother')
            : reverseType;
    return { fromUserId: sourceId, toUserId: targetId, type: inverseType };
  });
  return { userIds, relationships };
};

/** Find exactly two parent-child steps from a member, without following spouse or sibling links. */
export const getGrandGenerationIds = (focusUserId: string, links: FamilyTreeLink[]) => {
  const parentsByChild = new Map<string, Set<string>>();
  const childrenByParent = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, value: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(value);
  };

  links.forEach(link => {
    const from = String(link.fromUserId);
    const to = String(link.toUserId);
    const type = String(link.type || '').toLowerCase();
    if (['father', 'mother', 'parent'].includes(type)) {
      add(parentsByChild, from, to);
      add(childrenByParent, to, from);
    } else if (['son', 'daughter', 'child'].includes(type)) {
      add(childrenByParent, from, to);
      add(parentsByChild, to, from);
    }
  });

  const directParents = parentsByChild.get(String(focusUserId)) || new Set<string>();
  const directChildren = childrenByParent.get(String(focusUserId)) || new Set<string>();
  const grandparents = new Set<string>();
  const grandchildren = new Set<string>();
  directParents.forEach(parentId => (parentsByChild.get(parentId) || new Set<string>()).forEach(grandparentId => {
    if (grandparentId !== String(focusUserId) && !directParents.has(grandparentId)) grandparents.add(grandparentId);
  }));
  directChildren.forEach(childId => (childrenByParent.get(childId) || new Set<string>()).forEach(grandchildId => {
    if (grandchildId !== String(focusUserId) && !directChildren.has(grandchildId)) grandchildren.add(grandchildId);
  }));

  return { grandparents, grandchildren };
};
