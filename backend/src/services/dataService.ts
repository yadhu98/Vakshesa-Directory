import { db } from '../config/storage';

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

export const getLeaderboard = async (limit: number = 100): Promise<any[]> => {
  const allPoints = await db.find('points', {});
  const pointsByUser: Record<string, any> = {};

  for (const point of allPoints) {
    if (!pointsByUser[point.userId]) {
      const user = await db.findById('users', point.userId);
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
    .slice(0, limit)
    .map((item: any, index: number) => ({
      rank: index + 1,
      userId: item._id,
      userName: item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown',
      totalPoints: item.totalPoints,
      profilePicture: item.user?.profilePicture,
    }));
};

export const searchUsers = async (query: string, limit: number = 20) => {
  const allUsers = await db.find('users', {});
  let filtered;
  if (!query || query.trim() === '') {
    filtered = allUsers;
  } else {
    filtered = allUsers.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = u.email?.toLowerCase() || '';
      return fullName.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
    });
  }
  return filtered.slice(0, limit).map((u) => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
};

