# Project Architecture & Structure

Complete architectural overview of the Vksha Event Management System.

## Directory Structure

```
Vksha/
│
├── backend/                          # Express.js TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection setup
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts              # User schema with auth fields
│   │   │   ├── Family.ts            # Family groups
│   │   │   ├── FamilyNode.ts        # Tree structure relationships
│   │   │   ├── Event.ts             # Event management
│   │   │   ├── Stall.ts             # Vendor/kiosk setup
│   │   │   ├── Point.ts             # Point awards (Phase 2)
│   │   │   └── Sale.ts              # Transaction records
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Login, profile management
│   │   │   ├── userController.ts    # User profiles, search, family tree
│   │   │   ├── pointsController.ts  # Point allocation, leaderboard
│   │   │   └── adminController.ts   # Event control, admin functions
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication endpoints
│   │   │   ├── user.ts              # User data endpoints
│   │   │   ├── points.ts            # Point & sales endpoints
│   │   │   ├── admin.ts             # Admin control endpoints
│   │   │   └── bulk.ts              # Bulk operations, Excel import
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT verification, role checks, errors
│   │   │
│   │   ├── services/
│   │   │   ├── userService.ts       # User CRUD operations
│   │   │   └── dataService.ts       # Complex queries, aggregations
│   │   │
│   │   ├── utils/
│   │   │   └── auth.ts              # Token generation, password hashing, QR codes
│   │   │
│   │   ├── scripts/
│   │   │   └── seedData.ts          # Database initialization (optional)
│   │   │
│   │   └── index.ts                 # Main Express app setup
│   │
│   ├── dist/                         # Compiled JavaScript (generated)
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── .env.example                  # Environment template
│   ├── .gitignore                    # Git ignore rules
│   ├── README.md                     # Backend documentation
│   └── Dockerfile                    # Container setup (optional)
│
│
├── admin/                            # React Vite Admin Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx            # Sidebar + header navigation
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Authentication page
│   │   │   ├── Dashboard.tsx         # Overview & stats
│   │   │   ├── Users.tsx             # User management
│   │   │   ├── Families.tsx          # Family management
│   │   │   ├── Stalls.tsx            # Stall/vendor management
│   │   │   ├── Leaderboard.tsx       # Real-time rankings
│   │   │   └── EventSettings.tsx     # Phase 2 control, event config
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                # Axios instance, API calls
│   │   │
│   │   ├── utils/
│   │   │   └── hooks.ts              # Custom hooks (useAuth, useLocalStorage)
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   ├── App.tsx                   # Main app router
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── public/                       # Static assets
│   ├── index.html                    # HTML entry point
│   ├── vite.config.ts                # Vite bundler config
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── postcss.config.js             # PostCSS config
│   ├── package.json                  # Dependencies & scripts
│   ├── .env.example                  # Environment template
│   ├── .gitignore                    # Git ignore rules
│   └── README.md                     # Admin panel documentation
│
│
├── mobile/                           # React Native Expo App
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx            # Reusable UI components
│   │   │
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx       # User authentication
│   │   │   ├── HomeScreen.tsx        # Main home/dashboard
│   │   │   ├── ProfileScreen.tsx     # User profile management
│   │   │   ├── FamilyScreen.tsx      # Family tree view
│   │   │   ├── SearchScreen.tsx      # Search functionality
│   │   │   ├── QRScannerScreen.tsx   # QR code scanner (Phase 2)
│   │   │   ├── LeaderboardScreen.tsx # Live leaderboard
│   │   │   └── PointsScreen.tsx      # User's point history
│   │   │
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx     # Navigation structure
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                # API client with axios
│   │   │
│   │   ├── utils/
│   │   │   └── hooks.ts              # Custom hooks for mobile
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   ├── App.tsx                   # Main app container
│   │   └── main.tsx                  # Expo entry point
│   │
│   ├── app.json                      # Expo configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── package.json                  # Dependencies & scripts
│   ├── .env.example                  # Environment template
│   ├── .gitignore                    # Git ignore rules
│   ├── README.md                     # Mobile app documentation
│   └── eas.json                      # Expo build config
│
│
├── README.md                         # Project overview
├── QUICKSTART.md                     # Get running in 5 minutes
├── DEPLOYMENT.md                     # Free-tier deployment guide
├── SCALING.md                        # Performance & scaling strategies
├── API.md                            # Complete API reference
├── EVENT_DAY_MANUAL.md               # Operations & monitoring
├── ARCHITECTURE.md                   # This file
└── .github/
    └── copilot-instructions.md       # VS Code Copilot config
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                             │
├───────────────────────┬────────────────────┬────────────────────┤
│   Web Browser         │   Mobile Devices   │   Admin Desktop    │
│  (Admin Panel)        │  (React Native)    │  (React Dashboard) │
│   Vercel Host         │   Expo Builds      │   Vercel Host      │
└────────────┬──────────┴────────────┬───────┴────────────┬────────┘
             │                      │                     │
             │ HTTPS               │ HTTPS               │ HTTPS
             │                      │                     │
┌────────────▼──────────────────────▼─────────────────────▼────────┐
│                   Express.js Backend API                         │
│                    (Render.com Free Tier)                        │
│  Port: 5000                                                      │
├──────────────────────────────────────────────────────────────────┤
│                      Route Handlers                              │
│  ┌──────────────────┬──────────────────┬──────────────────────┐  │
│  │  Auth Routes     │  User Routes     │  Points Routes       │  │
│  │  /api/auth/*     │  /api/users/*    │  /api/points/*       │  │
│  ├──────────────────┼──────────────────┼──────────────────────┤  │
│  │  Admin Routes    │  Bulk Routes     │  Health Check        │  │
│  │  /api/admin/*    │  /api/bulk/*     │  /api/health         │  │
│  └──────────────────┴──────────────────┴──────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│              Middleware Layer                                    │
│  ┌──────────────────┬──────────────────┬──────────────────────┐  │
│  │ JWT Auth         │ Rate Limiting    │ Error Handler        │  │
│  │ Role Validation  │ CORS Handler     │ Request Logger       │  │
│  └──────────────────┴──────────────────┴──────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│              Service Layer                                       │
│  ┌──────────────────┬──────────────────┬──────────────────────┐  │
│  │ User Service     │ Data Service     │ Auth Utils           │  │
│  │ - CRUD Ops       │ - Aggregations   │ - Token Gen          │  │
│  │ - Validation     │ - Complex Queries│ - Password Hash      │  │
│  │ - Auth           │ - Leaderboard    │ - QR Generation      │  │
│  └──────────────────┴──────────────────┴──────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│              Data Access Layer                                   │
│  ┌──────────────────┬──────────────────┬──────────────────────┐  │
│  │ User Model       │ Family Model     │ FamilyNode Model     │  │
│  ├──────────────────┼──────────────────┼──────────────────────┤  │
│  │ Event Model      │ Stall Model      │ Point Model          │  │
│  ├──────────────────┴──────────────────┴──────────────────────┤  │
│  │ Sale Model       │ Mongoose ODM     │ Connection Pool      │  │
│  └──────────────────┴──────────────────┴──────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ TCP/IP Connection
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                    MongoDB Atlas                                 │
│                  (MongoDB Cloud Free)                            │
├──────────────────────────────────────────────────────────────────┤
│                  vksha-event Database                            │
│  ┌───────────┬──────────┬──────────┬──────────┬────────────────┐ │
│  │ Users     │ Families │ Family   │ Events   │ Stalls         │ │
│  │ Collection│ Coll.    │ Nodes    │ Coll.    │ Collection     │ │
│  │           │          │ Coll.    │          │                │ │
│  ├───────────┼──────────┼──────────┼──────────┼────────────────┤ │
│  │ Points    │ Sales    │ Sessions │ Backups  │ Archives       │ │
│  │ Collection│ Coll.    │ Coll.    │ (Auto)   │ (Manual)       │ │
│  └───────────┴──────────┴──────────┴──────────┴────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow

```
User Input (Email/Password)
    ↓
authController.login()
    ↓
userService.validateUserCredentials()
    ↓
User.findOne({ email })
    ↓
[MongoDB] Compare hashed password
    ↓
generateToken() [JWT]
    ↓
Return token + user info
    ↓
Client stores token (AsyncStorage / LocalStorage)
    ↓
Token sent in Authorization header for future requests
    ↓
authMiddleware.verifyToken()
    ↓
Request processed or rejected
```

### Point Award Flow

```
Shopkeeper scans QR code
    ↓
QR Scanner returns User ID
    ↓
pointsController.addPoints()
    ↓
Validate: User exists, Stall exists, Points > 0
    ↓
Point.create({
  userId, stallId, points, awardedBy, awardedAt
})
    ↓
[MongoDB] Insert point record
    ↓
Emit leaderboard update (could be WebSocket)
    ↓
Client receives confirmation
    ↓
Admin & Mobile apps fetch updated leaderboard
    ↓
Leaderboard re-renders with new rankings
```

### Leaderboard Calculation Flow

```
Client requests: GET /api/users/leaderboard
    ↓
Check cache (Redis/Node-Cache)
    ↓
If cached: Return cached leaderboard
    ↓
If not cached:
    ↓
Point.aggregate([
  { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
  { $sort: { totalPoints: -1 } },
  { $limit: limit }
])
    ↓
[MongoDB] Aggregation pipeline execution
    ↓
Join with User collection for names & pictures
    ↓
Cache result for 5 minutes
    ↓
Return ranked array with positions
    ↓
Client renders leaderboard with animations
```

## Technology Stack

### Backend
```
┌─ Runtime & Language ─────────┐
│ Node.js 18+                  │
│ TypeScript 5.3+              │
└──────────────────────────────┘
         ↓
┌─ Framework & Server ─────────┐
│ Express.js 4.18+             │
│ Cors, Helmet, Rate-Limit     │
└──────────────────────────────┘
         ↓
┌─ Database ───────────────────┐
│ MongoDB (Atlas)              │
│ Mongoose 8.0+ (ODM)          │
└──────────────────────────────┘
         ↓
┌─ Authentication ─────────────┐
│ JWT (jsonwebtoken)           │
│ bcryptjs (password hashing)  │
└──────────────────────────────┘
         ↓
┌─ Utilities ──────────────────┐
│ XLSX (Excel import)          │
│ QRCode (generation)          │
│ Multer (file upload)         │
└──────────────────────────────┘
```

### Admin Frontend
```
┌─ Build Tool ─────────────────┐
│ Vite 5.0+                    │
│ TypeScript                   │
└──────────────────────────────┘
         ↓
┌─ Framework & UI ─────────────┐
│ React 18                     │
│ TailwindCSS 3.4+             │
│ Lucide Icons                 │
└──────────────────────────────┘
         ↓
┌─ State & Routing ────────────┐
│ React Router 6.20+           │
│ Axios (HTTP client)          │
└──────────────────────────────┘
         ↓
┌─ Visualization ──────────────┐
│ Recharts (charts & graphs)   │
│ Date-fns (date formatting)   │
└──────────────────────────────┘
```

### Mobile Frontend
```
┌─ Runtime ────────────────────┐
│ Expo (React Native wrapper)  │
│ React Native 0.72+           │
└──────────────────────────────┘
         ↓
┌─ Navigation ─────────────────┐
│ React Navigation 6.1+        │
│ Bottom Tab Navigator         │
│ Stack Navigator              │
└──────────────────────────────┘
         ↓
┌─ Features ───────────────────┐
│ Expo Camera (QR scanning)    │
│ AsyncStorage (local data)    │
│ Axios (HTTP requests)        │
└──────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Repository                         │
│              (Single source of truth)                        │
└──────────┬─────────────────────────────────────┬────────────┘
           │                                     │
     backend/                              admin/
           │                                     │
┌──────────▼──────────┐              ┌───────────▼─────────────┐
│  Render.com         │              │  Vercel.com             │
│  (Node.js Hosting)  │              │  (Static Hosting)       │
│  ✓ Free tier        │              │  ✓ Free tier            │
│  ✓ Auto deployment  │              │  ✓ Auto deployment      │
│  ✓ Environment vars │              │  ✓ Environment vars     │
│  ✓ Logs & Metrics   │              │  ✓ Analytics            │
└──────────┬──────────┘              └───────────┬─────────────┘
           │                                     │
           │ API calls                          │ API calls
           │                                     │
           └──────────────┬──────────────────────┘
                          │
                    Backend API
                  https://render-url
                          │
                          │ Database
                          │ connections
                          │
           ┌──────────────▼──────────────┐
           │   MongoDB Atlas Cloud       │
           │   ✓ Free tier (512 MB)      │
           │   ✓ Shared cluster          │
           │   ✓ Automatic backups       │
           │   ✓ Point-in-time recovery  │
           └─────────────────────────────┘


mobile/ → Expo Builds
├─ iOS: TestFlight Distribution
│  └─ Upload to Google Drive
└─ Android: APK Distribution
   └─ Upload to Google Drive
```

## Scaling Layers

```
Level 0: Single Instance (Current - handles 100+ users)
├─ 1 Render dyno running Node.js
├─ 1 MongoDB shared cluster
└─ Vercel serverless for admin

Level 1: Upgraded Render (If needed)
├─ Starter plan ($7/month)
├─ More CPU/Memory
└─ Better performance under load

Level 2: Multiple Instances (Advanced)
├─ Load Balancer (Nginx)
├─ Multiple Node.js instances
├─ MongoDB replica set
└─ Redis caching layer

Level 3: Enterprise (Not needed for event)
├─ Kubernetes cluster
├─ MongoDB Atlas M5 tier
├─ CDN for static assets
└─ Dedicated database server
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│            HTTPS/TLS Layer              │
│  (Automatic on Render & Vercel)        │
└────────┬────────────────────────────────┘
         │
┌────────▼────────────────────────────────┐
│      Request Validation Layer           │
│  • Input sanitization                   │
│  • Rate limiting (100 req/15min)        │
│  • CORS policy enforcement              │
│  • Body size limits                     │
└────────┬────────────────────────────────┘
         │
┌────────▼────────────────────────────────┐
│      Authentication Layer               │
│  • JWT verification                     │
│  • Token expiration (7 days)            │
│  • Secure password hashing (bcrypt)     │
│  • Sessions in secure HttpOnly cookies  │
└────────┬────────────────────────────────┘
         │
┌────────▼────────────────────────────────┐
│      Authorization Layer                │
│  • Role-based access control            │
│  • Resource ownership checks            │
│  • Admin-only endpoints                 │
│  • Shopkeeper-only endpoints            │
└────────┬────────────────────────────────┘
         │
┌────────▼────────────────────────────────┐
│      Database Security                  │
│  • MongoDB IP whitelist                 │
│  • Credentials in environment vars      │
│  • Encrypted passwords                  │
│  • Regular backups                      │
└─────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
1. Database Level
   ├─ Indices on frequently queried fields
   ├─ Aggregation pipeline for leaderboard
   ├─ Query optimization
   └─ Connection pooling

2. API Level
   ├─ Response caching (5-min TTL)
   ├─ Pagination for large datasets
   ├─ Field selection (.select())
   ├─ Lean queries for read-only ops
   └─ Batch operations

3. Application Level
   ├─ Compression (gzip)
   ├─ Asset minification
   ├─ Code splitting
   ├─ Lazy loading
   └─ Rate limiting

4. Infrastructure Level
   ├─ CDN for static assets
   ├─ Database regional proximity
   ├─ Connection pooling
   └─ Load balancing (if needed)
```

## Error Handling Flow

```
                    API Request
                        │
                    Routes Handler
                        │
                    ┌───┴────┐
                    │         │
                Success    Error
                    │         │
              Response    Catch Block
              (200, 201)      │
                              │
                    Error Classification
                          │
                  ┌───────┼───────┐
                  │       │       │
              Validation Async  System
              Errors    Errors   Errors
                  │       │       │
              (400)   (500)   (500+)
                  │       │       │
                  └───────┼───────┘
                          │
                Error Middleware
                          │
                  ┌───────┴────────┐
                  │                │
              Development      Production
                  │                │
            Full Stack Trace   Message Only
                  │                │
              Client Response (JSON)
```

---

This architecture is designed to:
- ✅ Scale to 100+ concurrent users
- ✅ Stay within free-tier limits
- ✅ Be maintainable and extensible
- ✅ Provide good performance
- ✅ Keep data secure
- ✅ Allow easy debugging

For production use, refer to DEPLOYMENT.md and SCALING.md for optimization strategies.
