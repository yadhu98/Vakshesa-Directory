"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
const storage_1 = require("../config/storage");
const XLSX = __importStar(require("xlsx"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Excel import endpoint
router.post('/import-families', auth_1.authMiddleware, auth_1.adminMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file provided' });
            return;
        }
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        // Group by family
        const familiesByName = {};
        data.forEach((row) => {
            const familyName = row.familyName || 'Unassigned';
            if (!familiesByName[familyName]) {
                familiesByName[familyName] = [];
            }
            familiesByName[familyName].push(row);
        });
        const results = {
            usersCreated: 0,
            familiesCreated: 0,
            errors: [],
        };
        // Create families and users
        for (const [familyName, members] of Object.entries(familiesByName)) {
            try {
                // Create family
                const family = await storage_1.db.create('families', {
                    name: familyName,
                    description: `Family group: ${familyName}`,
                    members: [],
                });
                results.familiesCreated++;
                // Create users
                for (const member of members) {
                    try {
                        const user = await (0, userService_1.createUser)({
                            firstName: member.firstName,
                            lastName: member.lastName,
                            email: member.email,
                            phone: member.phone,
                            password: 'default123',
                            role: 'user',
                            familyId: family._id,
                        });
                        // Create family node
                        await storage_1.db.create('familynodes', {
                            userId: user._id,
                            familyId: family._id,
                            generation: 0,
                        });
                        results.usersCreated++;
                    }
                    catch (error) {
                        results.errors.push(`Failed to create user ${member.firstName}: ${error.message}`);
                    }
                }
            }
            catch (error) {
                results.errors.push(`Failed to create family ${familyName}: ${error.message}`);
            }
        }
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get all families
router.get('/families', auth_1.authMiddleware, async (req, res) => {
    try {
        const families = await storage_1.db.find('families', {});
        res.json(families);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get all users
router.get('/users', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { role, familyId } = req.query;
        let users = await storage_1.db.find('users', {});
        if (role)
            users = users.filter(u => u.role === role);
        if (familyId)
            users = users.filter(u => u.familyId === familyId);
        const filtered = users.map(u => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        }).slice(0, 100);
        res.json({ count: filtered.length, users: filtered });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create stall endpoint
router.post('/stalls', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { name, type, shopkeeperId, pointsPerTransaction } = req.body;
        const stall = await storage_1.db.create('stalls', {
            name,
            type,
            shopkeeperId,
            pointsPerTransaction: pointsPerTransaction || 10,
        });
        res.json({ message: 'Stall created', stall });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.default = router;
