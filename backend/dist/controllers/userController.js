"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardData = exports.search = exports.getFamilyTreeStructure = exports.getUserProfile = void 0;
const dataService_1 = require("../services/dataService");
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await (0, dataService_1.getUserById)(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const getFamilyTreeStructure = async (req, res) => {
    try {
        const { familyId } = req.params;
        const nodes = await (0, dataService_1.getFamilyTree)(familyId);
        const tree = (0, dataService_1.buildFamilyTreeStructure)(nodes);
        res.json({ tree, totalMembers: nodes.length });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFamilyTreeStructure = getFamilyTreeStructure;
const search = async (req, res) => {
    try {
        const { q, limit = '20' } = req.query;
        if (!q) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }
        const results = await (0, dataService_1.searchUsers)(String(q), parseInt(String(limit)));
        res.json({
            query: q,
            count: results.length,
            results,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.search = search;
const getLeaderboardData = async (req, res) => {
    try {
        const { limit = '100' } = req.query;
        const leaderboard = await (0, dataService_1.getLeaderboard)(parseInt(String(limit)));
        res.json({
            totalRanked: leaderboard.length,
            leaderboard,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLeaderboardData = getLeaderboardData;
