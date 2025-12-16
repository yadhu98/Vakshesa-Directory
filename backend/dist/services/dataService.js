"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.getLeaderboard = exports.buildFamilyTreeStructure = exports.getFamilyTree = exports.getFamilyById = exports.getUserById = void 0;
const storage_1 = require("../config/storage");
const getUserById = async (id) => {
    const user = await storage_1.db.findById('users', id);
    if (!user)
        return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.getUserById = getUserById;
const getFamilyById = async (id) => {
    return storage_1.db.findById('families', id);
};
exports.getFamilyById = getFamilyById;
const getFamilyTree = async (familyId) => {
    return storage_1.db.find('familynodes', { familyId });
};
exports.getFamilyTree = getFamilyTree;
const buildFamilyTreeStructure = (nodes) => {
    const tree = {};
    const nodeMap = {};
    nodes.forEach((node) => {
        nodeMap[node.userId] = {
            ...node,
            children: [],
        };
    });
    nodes.forEach((node) => {
        if (node.parentId && nodeMap[node.parentId]) {
            nodeMap[node.parentId].children.push(nodeMap[node.userId]);
        }
        else {
            tree[node.userId] = nodeMap[node.userId];
        }
    });
    return tree;
};
exports.buildFamilyTreeStructure = buildFamilyTreeStructure;
const getLeaderboard = async (limit = 100) => {
    const allPoints = await storage_1.db.find('points', {});
    const pointsByUser = {};
    for (const point of allPoints) {
        if (!pointsByUser[point.userId]) {
            const user = await storage_1.db.findById('users', point.userId);
            pointsByUser[point.userId] = {
                _id: point.userId,
                totalPoints: 0,
                user,
            };
        }
        pointsByUser[point.userId].totalPoints += point.points;
    }
    return Object.values(pointsByUser)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit)
        .map((item, index) => ({
        rank: index + 1,
        userId: item._id,
        userName: item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown',
        totalPoints: item.totalPoints,
        profilePicture: item.user?.profilePicture,
    }));
};
exports.getLeaderboard = getLeaderboard;
const searchUsers = async (query, limit = 20) => {
    const allUsers = await storage_1.db.find('users', {});
    return allUsers
        .filter((u) => {
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = u.email?.toLowerCase() || '';
        return fullName.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
    })
        .slice(0, limit)
        .map((u) => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
};
exports.searchUsers = searchUsers;
