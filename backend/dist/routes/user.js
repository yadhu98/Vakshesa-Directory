"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Specific routes first (before parameterized routes)
router.get('/search', auth_1.authMiddleware, userController_1.search);
router.get('/leaderboard', auth_1.authMiddleware, userController_1.getLeaderboardData);
router.get('/family/:familyId/tree', auth_1.authMiddleware, userController_1.getFamilyTreeStructure);
// Parameterized routes last
router.get('/:userId', auth_1.authMiddleware, userController_1.getUserProfile);
router.put('/:userId/profile', auth_1.authMiddleware, userController_1.updateUser);
router.patch('/:userId/status', auth_1.authMiddleware, auth_1.adminMiddleware, userController_1.toggleUserStatus);
router.put('/:userId', auth_1.authMiddleware, auth_1.adminMiddleware, userController_1.updateUser);
router.delete('/:userId', auth_1.authMiddleware, auth_1.adminMiddleware, userController_1.deleteUser);
exports.default = router;
