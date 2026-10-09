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
import announcementRoutes from './routes/announcements';
import userRoutes from './routes/user';
import pointsRoutes from './routes/points';
import adminRoutes from './routes/admin';
import familyRoutes from './routes/families';
import tokenRoutes from './routes/tokens';
import inviteRoutes from './routes/inviteRoutes';
import { wsService } from './services/websocket';
import { DEFAULT_PRIVACY_SETTINGS } from './models/User';

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
app.use('/api/announcements', announcementRoutes);
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
import relationshipRoutes from './routes/relationships';
app.use('/api/family-tree', familyTreeRoutes);
app.use('/api/relationships', relationshipRoutes);

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
        membershipStatus: 'Approved',
        privacySettings: { ...DEFAULT_PRIVACY_SETTINGS },
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
    
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
  }
};

const initializeLocalTestUser = async () => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const phone = '9916981907';
    const superAdmin = await db.findOne('users', { email: 'admin@vakshesa.com' });
    if (!superAdmin?.familyId) {
      console.warn('⚠️ Local test user was not created because the default family is unavailable');
      return;
    }
    const { hashPassword } = await import('./utils/auth');
    const password = await hashPassword('123456');
    const existing = await db.findOne('users', { phone });
    const testUser = {
      firstName: 'Harikrishnan',
      lastName: 'Test',
      phone,
      countryCode: '+91',
      password,
      role: 'user',
      isSuperUser: false,
      membershipStatus: 'Approved',
      privacySettings: { ...DEFAULT_PRIVACY_SETTINGS },
      familyId: superAdmin.familyId,
      house: 'Mankada',
      isActive: true,
    };
    if (existing) await db.updateOne('users', { _id: existing._id }, testUser);
    else await db.create('users', testUser);
    console.log(`✅ Local regular test user ready (${phone})`);
  } catch (error) {
    console.error('❌ Failed to initialize local test user:', error);
  }
};

const initializeLocalFamilyTreeTestUsers = async () => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const superAdmin = await db.findOne('users', { email: 'admin@vakshesa.com' });
    if (!superAdmin?.familyId) return;
    const { hashPassword } = await import('./utils/auth');
    const password = await hashPassword('123456');
    const users = [
      { firstName: 'Arjun', lastName: 'KC', gender: 'male', house: 'Kadannamanna' },
      { firstName: 'Anjali', lastName: 'MC', gender: 'female', house: 'Mankada' },
      { firstName: 'Devika', lastName: 'Varma', gender: 'female', house: 'Ayiranazhi' },
      { firstName: 'Gautham', lastName: 'Raja', gender: 'male', house: 'Aripra' },
      { firstName: 'Meera', lastName: 'KC', gender: 'female', house: 'Kadannamanna' },
      { firstName: 'Rahul', lastName: 'MC', gender: 'male', house: 'Mankada' },
      { firstName: 'Nisha', lastName: 'Varma', gender: 'female', house: 'Ayiranazhi' },
      { firstName: 'Kiran', lastName: 'Raja', gender: 'male', house: 'Aripra' },
      { firstName: 'Priya', lastName: 'KC', gender: 'female', house: 'Kadannamanna' },
      { firstName: 'Anand', lastName: 'MC', gender: 'male', house: 'Mankada' },
    ];
    let created = 0;
    for (const [index, person] of users.entries()) {
      const suffix = String(index + 1).padStart(2, '0');
      const email = `familytree.test.${suffix}@local.invalid`;
      const phone = `90000000${String(index + 1).padStart(2, '0')}`;
      const record = {
        ...person,
        email,
        phone,
        countryCode: '+91',
        password,
        role: 'user',
        isSuperUser: false,
        membershipStatus: 'Approved',
        privacySettings: { ...DEFAULT_PRIVACY_SETTINGS },
        familyId: superAdmin.familyId,
        isActive: true,
      };
      const existingByEmail = await db.findOne('users', { email });
      if (existingByEmail) {
        await db.updateOne('users', { _id: existingByEmail._id }, record);
        continue;
      }
      const phoneOwner = await db.findOne('users', { phone });
      if (phoneOwner) {
        console.warn(`⚠️ Skipping local family test user ${suffix}; phone ${phone} is already in use`);
        continue;
      }
      await db.create('users', record);
      created++;
    }
    console.log(`✅ Local family-tree test accounts ready (${created} added; all use password 123456)`);
  } catch (error) {
    console.error('❌ Failed to initialize local family-tree test accounts:', error);
  }
};

const migrateLegacyAccessDefaults = async () => {
  const users = await db.find('users', {});
  for (const user of users) {
    const updates: Record<string, any> = {};
    if (!user.membershipStatus) updates.membershipStatus = 'Approved';
    if (!user.privacySettings) updates.privacySettings = { ...DEFAULT_PRIVACY_SETTINGS };
    if (Object.keys(updates).length) await db.updateOne('users', { _id: user._id }, updates);
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

    await migrateLegacyAccessDefaults();
    
    // Initialize super admin
    await initializeSuperAdmin();
    await initializeLocalTestUser();
    await initializeLocalFamilyTreeTestUsers();
    
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
