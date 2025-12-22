import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';

import { db } from './config/storage';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import pointsRoutes from './routes/points';
import adminRoutes from './routes/admin';
import familyRoutes from './routes/families';
import tokenRoutes from './routes/tokens';
import inviteRoutes from './routes/inviteRoutes';
import { wsService } from './services/websocket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 5000;

// Trust proxy for dev tunnels and reverse proxies
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: false, // Must be false when origin is '*'
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/invites', inviteRoutes);

// Events
import eventRoutes from './routes/events';
app.use('/api/events', eventRoutes);

// Carnival Stalls
import carnivalStallRoutes from './routes/carnivalStalls';
app.use('/api/carnival-stalls', carnivalStallRoutes);

// Carnival Admin
import carnivalAdminRoutes from './routes/carnivalAdmin';
app.use('/api/carnival-admin', carnivalAdminRoutes);

// Analytics
import analyticsRoutes from './routes/analytics';
app.use('/api/analytics', analyticsRoutes);

// Bulk operations (import, stall creation, etc)
const bulkRoutes = require('./routes/bulk').default;
app.use('/api/bulk', bulkRoutes);

// Family Tree
import familyTreeRoutes from './routes/familyTree';
app.use('/api/family-tree', familyTreeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize super admin user
const initializeSuperAdmin = async () => {
  try {
    const superAdminEmail = 'admin@vakshesa.com';
    const existingAdmin = await db.findOne('users', { email: superAdminEmail });
    
    if (!existingAdmin) {
      const { hashPassword } = await import('./utils/auth');
      const hashedPassword = await hashPassword('Vakshesa@2025');
      
      // Create default family if it doesn't exist
      let defaultFamily = await db.findOne('families', { name: 'Admin Family' });
      if (!defaultFamily) {
        defaultFamily = await db.create('families', {
          name: 'Admin Family',
          description: 'Administrative family',
          members: [],
          isActive: true,
        });
      }
      
      const superAdmin = await db.create('users', {
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
    } else {
      // Update existing admin to ensure isSuperUser flag is set
      if (!existingAdmin.isSuperUser) {
        await db.updateOne('users', { email: superAdminEmail }, { isSuperUser: true });
        console.log('✅ Super Admin updated with isSuperUser flag');
      } else {
        console.log('✅ Super Admin already has isSuperUser flag');
      }
      console.log('ℹ️  Super Admin exists - Email: admin@vakshesa.com');
    }
    
    // Also update all users with role 'admin' to have isSuperUser flag
    const allAdmins = await db.find('users', { role: 'admin' });
    for (const admin of allAdmins) {
      if (!admin.isSuperUser) {
        await db.updateOne('users', { _id: admin._id }, { isSuperUser: true });
        console.log(`✅ Updated admin ${admin.email} with isSuperUser flag`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB if using MongoDB storage
    if (process.env.STORAGE_MODE === 'mongodb') {
      await connectDB();
    } else {
      console.log('📦 Using in-memory storage');
    }
    
    // Initialize super admin
    await initializeSuperAdmin();
    
    // Initialize WebSocket server
    wsService.initialize(server);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
