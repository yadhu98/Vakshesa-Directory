"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventStatus = exports.togglePhase2 = void 0;
const storage_1 = require("../config/storage");
const togglePhase2 = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { isActive } = req.body;
        const event = await storage_1.db.updateOne('events', { _id: eventId }, {
            isPhase2Active: isActive,
            phase2StartDate: isActive ? new Date() : null,
        });
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        res.json({
            message: `Phase 2 ${isActive ? 'activated' : 'deactivated'}`,
            event,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.togglePhase2 = togglePhase2;
const getEventStatus = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await storage_1.db.findById('events', eventId);
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        res.json({
            message: 'Event status retrieved',
            event,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEventStatus = getEventStatus;
