"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.put('/event/:eventId/phase2', auth_1.authMiddleware, auth_1.adminMiddleware, adminController_1.togglePhase2);
router.get('/event/:eventId/status', auth_1.authMiddleware, auth_1.adminMiddleware, adminController_1.getEventStatus);
exports.default = router;
