# Deployment Guide - Vksha Event Management System

Complete step-by-step guide to deploy all services using free tier platforms.

## Table of Contents

1. [MongoDB Atlas Setup](#mongodb-atlas-setup)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Admin Panel Deployment (Vercel)](#admin-panel-deployment-vercel)
4. [Mobile App Distribution](#mobile-app-distribution)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## MongoDB Atlas Setup

### Step 1: Create MongoDB Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Create account with email
4. Verify email

### Step 2: Create Free Tier Cluster

1. On dashboard, click "Create"
2. Select free tier (M0)
3. Choose cloud provider: AWS
4. Select region closest to your event location
5. Name your cluster: `vksha-event`
6. Click "Create Cluster" (takes 2-3 minutes)

### Step 3: Configure Security

1. In "Security" → "Database Access"
   - Create database user
   - Username: `vksha_user`
   - Password: Generate secure password (save it!)
   - Privilege: Read and write to any database

2. In "Security" → "Network Access"
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (allow all - needed for Render)
   - Click "Confirm"

### Step 4: Get Connection String

1. On cluster page, click "Connect"
2. Choose "Drivers"
3. Select "Node.js"
4. Copy connection string
5. Replace `<password>` with your user password
6. Replace `myFirstDatabase` with `vksha-event`

Example:
```
mongodb+srv://vksha_user:PASSWORD@vksha-event.xxxxx.mongodb.net/vksha-event?retryWrites=true&w=majority
```

## Backend Deployment (Render)

### Step 1: Create Render Account

1. Go to [render.com](https://www.render.com)
2. Click "Sign up"
3. Sign up with GitHub (easier for CI/CD)
4. Authorize Render to access GitHub

### Step 2: Prepare GitHub Repository

1. Push your code to GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/vksha.git
   git push -u origin main
   ```

2. Create `.env` in backend (Render will override):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secure_random_string
   BCRYPT_ROUNDS=10
   CORS_ORIGIN=your_admin_url,http://localhost:3001
   ```

### Step 3: Create Web Service on Render

1. On Render dashboard, click "New +"
2. Select "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `vksha-backend`
   - **Environment**: Node
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```

5. Click "Advanced"
   - Add environment variables:
     ```
     NODE_ENV = production
     MONGODB_URI = your_mongodb_connection_string
     JWT_SECRET = your_secure_secret
     BCRYPT_ROUNDS = 10
     CORS_ORIGIN = your_admin_domain,http://localhost:3001
     ```

6. Click "Deploy Web Service"

### Step 4: Verify Backend Deployment

1. Copy your Render URL: `https://vksha-backend.onrender.com`
2. Test health endpoint: 
   ```bash
   curl https://vksha-backend.onrender.com/api/health
   ```
3. Should return: `{"status":"OK"}`

## Admin Panel Deployment (Vercel)

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub

### Step 2: Deploy Admin Panel

1. On Vercel dashboard, click "Add New Project"
2. Select the `admin` folder from your repository
3. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add environment variable:
   ```
   VITE_API_URL = https://vksha-backend.onrender.com/api
   ```

5. Click "Deploy"

### Step 3: Verify Admin Deployment

1. Copy your Vercel URL
2. Access admin panel: `https://your-vercel-url`
3. Login with:
   - Email: `admin@vksha.com`
   - Password: `change_me`

4. **Change default credentials** immediately!

## Mobile App Distribution

### Step 1: Build iOS App

```bash
cd mobile
npm run build-ios
```

1. Render will start building
2. Wait for build to complete
3. On completion, download IPA file
4. Create Google Drive folder: "Vksha iOS App"
5. Upload IPA file
6. Share folder with family members

### Step 2: Build Android App

```bash
cd mobile
npm run build-android
```

1. Render will start building
2. Wait for build to complete
3. Download APK file
4. Create Google Drive folder: "Vksha Android App"
5. Upload APK file
6. Share folder with family members

### Step 3: Create Installation Instructions

Create a document for distribution:

**For iOS:**
- Download IPA file
- Use TestFlight or Xcode to install
- Instructions: [Apple Developer Guide](https://developer.apple.com/testflight/)

**For Android:**
- Download APK file
- Enable "Unknown Sources" in Settings
- Install APK directly on device

## Environment Configuration

### Backend .env
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://vksha_user:PASSWORD@cluster.mongodb.net/vksha-event
JWT_SECRET=use-openssl-rand-base64-32
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://admin.yourdomain.com,http://localhost:3001
ADMIN_EMAIL=admin@vksha.com
ADMIN_PASSWORD=change_this_in_production
```

### Admin .env
```
VITE_API_URL=https://vksha-backend.onrender.com/api
```

### Mobile .env
```
EXPO_PUBLIC_API_URL=https://vksha-backend.onrender.com/api
```

## Post-Deployment Setup

### Step 1: Create Initial Admin User

1. Connect to your MongoDB:
   ```bash
   mongosh "your_connection_string"
   ```

2. Switch to vksha-event database:
   ```javascript
   use vksha-event
   ```

3. Create admin user:
   ```javascript
   db.users.insertOne({
     firstName: "Admin",
     lastName: "User",
     email: "admin@vksha.com",
     phone: "+91-0000000000",
     password: "$2a$10$...", // bcrypt hash
     role: "admin",
     familyId: ObjectId(),
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   Or use this script to generate hash:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('change_me', 10))"
   ```

### Step 2: Create First Event

1. Access admin panel
2. Create event entry in database:
   ```javascript
   db.events.insertOne({
     name: "Family Festival 2024",
     description: "Annual family gathering",
     startDate: new Date("2024-12-22"),
     endDate: new Date("2024-12-25"),
     location: "Your Location",
     isPhase2Active: false,
     maxPoints: 1000,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

### Step 3: Load Family Data

1. Prepare Excel file with columns:
   - firstName, lastName, email, phone, familyName
2. In admin panel, upload file
3. System creates users and assigns to families

### Step 4: Create Stalls

1. In admin dashboard, create stalls:
   - Food stalls
   - Gaming kiosks
   - Activities
   - Shopping

2. Assign shopkeepers to each stall

## Monitoring & Maintenance

### Daily During Event

1. **Check Backend Health**
   ```bash
   curl https://vksha-backend.onrender.com/api/health
   ```

2. **Monitor Dashboard**
   - Render: Check CPU/Memory usage
   - MongoDB: Check connections
   - Vercel: Check function calls

3. **Check Error Logs**
   - Render: Logs tab
   - MongoDB: Activity feed
   - Vercel: Analytics

### Performance Metrics to Track

- Response time (should be <200ms)
- Error rate (should be <0.1%)
- Database connections (free tier allows 500)
- Request count (Render free: limited)

### If Performance Degrades

1. **Increase Resources**
   - Render: Upgrade to paid plan ($7/month)
   - MongoDB: Upgrade to M2 tier
   - Vercel: Already optimized

2. **Implement Caching**
   - Cache leaderboard (5-minute TTL)
   - Cache user profiles
   - Cache family trees

3. **Optimize Database**
   - Add indexes for slow queries
   - Archive old data
   - Optimize aggregation pipelines

### Post-Event

1. **Backup Data**
   ```javascript
   // In MongoDB
   db.collections.forEach(function(col) {
     col.find().forEach(function(doc) {
       // Save to file
     })
   })
   ```

2. **Scale Down**
   - Return Render to free tier
   - Ensure MongoDB connections closed
   - Archive old data

3. **Generate Reports**
   - Export leaderboard data
   - Generate family statistics
   - Export transaction records

## Troubleshooting Deployment

### Backend Won't Deploy

1. Check build logs on Render
2. Verify all dependencies in package.json
3. Check for TypeScript compilation errors
4. Verify environment variables set

### Admin Panel 404 Error

1. Check that `admin` folder is in root
2. Verify build command: `npm run build`
3. Check that dist folder is created
4. Clear Vercel cache and redeploy

### Mobile App Won't Connect

1. Verify backend API_URL is correct
2. Check CORS settings on backend
3. Test API manually with curl
4. Check if backend is running

### High Latency Issues

1. Verify MongoDB region matches backend region
2. Check network latency: `ping your-backend-url`
3. Consider upgrading to paid tier
4. Implement caching strategies

## Useful Commands

```bash
# Test backend locally
npm run dev

# Build for production
npm run build

# Get MongoDB stats
mongo "your_connection_string" --eval "db.stats()"

# Clear Vercel cache
vercel env pull # pulls latest env vars

# Monitor Render logs
render logs vksha-backend

# Check Node version
node --version

# Generate JWT Secret
openssl rand -base64 32
```

## Cost Estimate

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render (Backend) | 750 hours/month | $7/month (optional) |
| MongoDB Atlas | 512 MB storage | Free for event |
| Vercel (Admin) | 100 GB bandwidth | Free for event |
| **Total** | **All Free** | **$0** |

## Security Checklist Before Event

- [ ] Change admin credentials
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS whitelist
- [ ] Enable MongoDB IP whitelist
- [ ] Test authentication flows
- [ ] Verify rate limiting works
- [ ] Test data validation
- [ ] Check HTTPS (automatic)
- [ ] Review error messages (no stack traces in prod)
- [ ] Test backup restoration

---

**Deployment Checklist**

- [ ] MongoDB cluster created
- [ ] Backend deployed on Render
- [ ] Admin panel deployed on Vercel
- [ ] Mobile app built and distributed
- [ ] Health checks passing
- [ ] Test users created
- [ ] Family data imported
- [ ] Stalls configured
- [ ] Admin credentials changed
- [ ] Performance tested with 50+ users
- [ ] Backup strategy verified
- [ ] Team trained on systems
