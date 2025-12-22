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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const storage_1 = require("./config/storage");
const database_1 = require("./config/database");
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const points_1 = __importDefault(require("./routes/points"));
const admin_1 = __importDefault(require("./routes/admin"));
const families_1 = __importDefault(require("./routes/families"));
const tokens_1 = __importDefault(require("./routes/tokens"));
const inviteRoutes_1 = __importDefault(require("./routes/inviteRoutes"));
const websocket_1 = require("./services/websocket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = Number(process.env.PORT) || 5000;
// Trust proxy for dev tunnels and reverse proxies
app.set('trust proxy', true);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for development
    credentials: false, // Must be false when origin is '*'
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting - more permissive for development
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 for dev, 100 for production
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip validation in development when using dev tunnels
    validate: {
        trustProxy: false,
        xForwardedForHeader: false,
    },
});
app.use(limiter);
// Body parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Routes
app.use('/api/auth', auth_2.default);
app.use('/api/users', user_1.default);
app.use('/api/points', points_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/families', families_1.default);
app.use('/api/tokens', tokens_1.default);
app.use('/api/invites', inviteRoutes_1.default);
// Events
const events_1 = __importDefault(require("./routes/events"));
app.use('/api/events', events_1.default);
// Carnival Stalls
const carnivalStalls_1 = __importDefault(require("./routes/carnivalStalls"));
app.use('/api/carnival-stalls', carnivalStalls_1.default);
// Carnival Admin
const carnivalAdmin_1 = __importDefault(require("./routes/carnivalAdmin"));
app.use('/api/carnival-admin', carnivalAdmin_1.default);
// Analytics
const analytics_1 = __importDefault(require("./routes/analytics"));
app.use('/api/analytics', analytics_1.default);
// Bulk operations (import, stall creation, etc)
const bulkRoutes = require('./routes/bulk').default;
app.use('/api/bulk', bulkRoutes);
// Family Tree
const familyTree_1 = __importDefault(require("./routes/familyTree"));
app.use('/api/family-tree', familyTree_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use(auth_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Initialize super admin user
const initializeSuperAdmin = async () => {
    try {
        const superAdminEmail = 'admin@vakshesa.com';
        const existingAdmin = await storage_1.db.findOne('users', { email: superAdminEmail });
        if (!existingAdmin) {
            const { hashPassword } = await Promise.resolve().then(() => __importStar(require('./utils/auth')));
            const hashedPassword = await hashPassword('Vakshesa@2025');
            // Create default family if it doesn't exist
            let defaultFamily = await storage_1.db.findOne('families', { name: 'Admin Family' });
            if (!defaultFamily) {
                defaultFamily = await storage_1.db.create('families', {
                    name: 'Admin Family',
                    description: 'Administrative family',
                    members: [],
                    isActive: true,
                });
            }
            const superAdmin = await storage_1.db.create('users', {
                firstName: 'Super',
                lastName: 'Admin',
                email: superAdminEmail,
                phone: '+919999999999',
                password: hashedPassword,
                role: 'admin',
                house: 'Kadannamanna',
                familyId: defaultFamily._id,
                isActive: true,
                isSuperUser: true, // Super admin flag
            });
            console.log('✅ Super Admin created successfully');
            console.log('📧 Email: admin@vakshesa.com');
            console.log('🔑 Password: Vakshesa@2025');
            console.log('👑 isSuperUser: true');
        }
        else {
            // Update existing admin to ensure isSuperUser flag is set
            if (!existingAdmin.isSuperUser) {
                await storage_1.db.updateOne('users', { email: superAdminEmail }, { isSuperUser: true });
                console.log('✅ Super Admin updated with isSuperUser flag');
            }
            else {
                console.log('✅ Super Admin already has isSuperUser flag');
            }
            console.log('ℹ️  Super Admin exists - Email: admin@vakshesa.com');
        }
        // Also update all users with role 'admin' to have isSuperUser flag
        const allAdmins = await storage_1.db.find('users', { role: 'admin' });
        for (const admin of allAdmins) {
            if (!admin.isSuperUser) {
                await storage_1.db.updateOne('users', { _id: admin._id }, { isSuperUser: true });
                console.log(`✅ Updated admin ${admin.email} with isSuperUser flag`);
            }
        }
    }
    catch (error) {
        console.error('❌ Failed to create Super Admin:', error);
    }
};
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB if using MongoDB storage
        if (process.env.STORAGE_MODE === 'mongodb') {
            await (0, database_1.connectDB)();
        }
        else {
            console.log('📦 Using in-memory storage');
        }
        // Initialize super admin
        await initializeSuperAdmin();
        // Initialize WebSocket server
        websocket_1.wsService.initialize(server);
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 WebSocket server ready`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
