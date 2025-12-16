"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = exports.comparePassword = exports.hashPassword = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, (process.env.JWT_SECRET || 'secret'), { expiresIn: process.env.JWT_EXPIRE || '7d' });
};
exports.generateToken = generateToken;
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '10'));
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
const generateQRCode = async (data) => {
    const QRCode = require('qrcode');
    return QRCode.toDataURL(data);
};
exports.generateQRCode = generateQRCode;
