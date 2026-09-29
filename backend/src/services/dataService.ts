import { db } from '../config/storage';
import { sanitizeUserForViewer } from './profilePrivacy';

export const getUserById = async (id: string) => {
  const user = await db.findById('users', id);
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getFamilyById = async (id: string) => {
  return db.findById('families', id);
};

export const getFamilyTree = async (familyId: string) => {
  return db.find('familynodes', { familyId });
};

export const buildFamilyTreeStructure = (nodes: any[]): Record<string, any> => {
  const tree: Record<string, any> = {};
  const nodeMap: Record<string, any> = {};

  nodes.forEach((node) => {
    nodeMap[node.userId] = {
      ...node,
      children: [],
    };
  });

  nodes.forEach((node) => {
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(nodeMap[node.userId]);
    } else {
      tree[node.userId] = nodeMap[node.userId];
    }
  });

  return tree;
};

export const getLeaderboard = async (limit: number = 100, familyId?: string, viewerId?: string): Promise<any[]> => {
  if (!familyId) return [];
  const allPoints = await db.find('points', {});
  const pointsByUser: Record<string, any> = {};

  for (const point of allPoints) {
    if (!pointsByUser[point.userId]) {
      const user = await db.findById('users', point.userId);
      if (user && (
        user.familyId !== familyId ||
        user.isActive === false ||
        user.membershipStatus !== 'Approved'
      )) continue;
      pointsByUser[point.userId] = {
        _id: point.userId,
        totalPoints: 0,
        user,
      };
    }
    pointsByUser[point.userId].totalPoints += point.points;
  }

  return Object.values(pointsByUser)
    .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
    .slice(0, Math.min(Math.max(limit, 1), 1000))
    .map((item: any, index: number) => {
      const profile = item.user ? sanitizeUserForViewer(item.user, String(viewerId || '')) : null;
      const visibleName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '';
      return {
      rank: index + 1,
      userId: item._id,
      userName: visibleName || 'Family member',
      totalPoints: item.totalPoints,
      profilePicture: profile?.profilePicture,
      };
    });
};

export const searchUsers = async (query: string, limit: number = 20, familyId?: string, viewerId?: string) => {
  if (!familyId) return [];
  const allUsers = await db.find('users', {});
  let filtered = allUsers.filter((u) =>
    u.familyId === familyId &&
    u.isActive !== false &&
    u.membershipStatus === 'Approved'
  );
  if (!query || query.trim() === '') {
    // Keep only approved members from the caller's family.
  } else {
    filtered = filtered.filter((u) => {
      const profile = sanitizeUserForViewer(u, String(viewerId || ''));
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
      return fullName.includes(query.toLowerCase());
    });
  }
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 20;
  return filtered.slice(0, safeLimit).map((u) => sanitizeUserForViewer(u, String(viewerId || '')));
};

