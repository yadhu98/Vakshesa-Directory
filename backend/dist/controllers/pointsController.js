"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStallSales = exports.recordSale = exports.getUserPoints = exports.addPoints = void 0;
const storage_1 = require("../config/storage");
const addPoints = async (req, res) => {
    try {
        const { userId, stallId, points, qrCodeData } = req.body;
        const shopkeeperId = req.user?.id;
        if (!userId || !stallId || !points) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const point = await storage_1.db.create('points', {
            userId,
            stallId,
            points,
            qrCodeData,
            awardedBy: shopkeeperId,
            awardedAt: new Date(),
        });
        res.json({
            message: 'Points added successfully',
            point,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.addPoints = addPoints;
const getUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const userPoints = await storage_1.db.find('points', { userId });
        const totalPoints = userPoints.reduce((sum, p) => sum + p.points, 0);
        res.json({ userId, totalPoints });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUserPoints = getUserPoints;
const recordSale = async (req, res) => {
    try {
        const { userId, stallId, amount, description } = req.body;
        if (!userId || !stallId || !amount) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const sale = await storage_1.db.create('sales', {
            stallId,
            userId,
            amount,
            description,
        });
        res.json({
            message: 'Sale recorded successfully',
            sale,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.recordSale = recordSale;
const getStallSales = async (req, res) => {
    try {
        const { stallId } = req.params;
        const stallSales = await storage_1.db.find('sales', { stallId });
        const totalSales = stallSales.reduce((sum, s) => sum + s.amount, 0);
        res.json({ stallId, totalSales, transactionCount: stallSales.length });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getStallSales = getStallSales;
