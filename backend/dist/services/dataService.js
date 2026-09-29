"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.getLeaderboard = exports.buildFamilyTreeStructure = exports.getFamilyTree = exports.getFamilyById = exports.getUserById = void 0;
const storage_1 = require("../config/storage");
const profilePrivacy_1 = require("./profilePrivacy");
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
const getLeaderboard = async (limit = 100, familyId, viewerId) => {
    if (!familyId)
        return [];
    const allPoints = await storage_1.db.find('points', {});
    const pointsByUser = {};
    for (const point of allPoints) {
        if (!pointsByUser[point.userId]) {
            const user = await storage_1.db.findById('users', point.userId);
            if (user && (user.familyId !== familyId ||
                user.isActive === false ||
                user.membershipStatus !== 'Approved'))
                continue;
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
        .slice(0, Math.min(Math.max(limit, 1), 1000))
        .map((item, index) => {
        const profile = item.user ? (0, profilePrivacy_1.sanitizeUserForViewer)(item.user, String(viewerId || '')) : null;
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
exports.getLeaderboard = getLeaderboard;
const searchUsers = async (query, limit = 20, familyId, viewerId) => {
    if (!familyId)
        return [];
    const allUsers = await storage_1.db.find('users', {});
    let filtered = allUsers.filter((u) => u.familyId === familyId &&
        u.isActive !== false &&
        u.membershipStatus === 'Approved');
    if (!query || query.trim() === '') {
        // Keep only approved members from the caller's family.
    }
    else {
        filtered = filtered.filter((u) => {
            const profile = (0, profilePrivacy_1.sanitizeUserForViewer)(u, String(viewerId || ''));
            const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
            return fullName.includes(query.toLowerCase());
        });
    }
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 20;
    return filtered.slice(0, safeLimit).map((u) => (0, profilePrivacy_1.sanitizeUserForViewer)(u, String(viewerId || '')));
};
exports.searchUsers = searchUsers;
