# Quick Start Guide - 5 Minutes to Running

Get the entire Vksha system running locally in under 5 minutes.

## Prerequisites

- Node.js 16+ installed
- MongoDB account (or running locally)
- Git installed

## Step 1: Clone & Install (2 minutes)

```bash
# Navigate to the workspace
cd Vksha

# Install backend
cd backend
npm install

# Install admin panel
cd ../admin
npm install

# Install mobile app
cd ../mobile
npm install

cd ..
```

## Step 2: Configure Environment (1 minute)

### Backend `.backend/.env`
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vksha-event
JWT_SECRET=your_super_secret_key_12345678901234567890
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Admin `admin/.env`
```
VITE_API_URL=http://localhost:5000/api
```

### Mobile `mobile/.env`
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 3: Start Services (2 minutes)

Open 3 terminal windows:

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2: Admin Panel**
```bash
cd admin
npm run dev
# Admin panel running on http://localhost:3001
```

**Terminal 3: Mobile App**
```bash
cd mobile
npm start
# Expo ready - scan QR code with Expo Go app
```

## Step 4: Login & Test

1. **Admin Panel**: http://localhost:3001
   - Email: `admin@vksha.com`
   - Password: `change_me`

2. **Backend API**: http://localhost:5000/api/health
   - Should return: `{"status":"OK"}`

3. **Mobile App**: 
   - Open Expo Go on your phone
   - Scan QR code from terminal 3
   - Use same credentials to login

## Next Steps

1. **Import Family Data**
   - Create Excel file with columns: firstName, lastName, email, phone, familyName
   - Use admin panel to import file

2. **Create Stalls**
   - Admin panel → Stalls
   - Add food stalls, games, activities

3. **Create Shopkeepers**
   - Add shopkeeper role users
   - Assign to stalls

4. **Activate Phase 2**
   - Admin panel → Event Settings
   - Toggle Phase 2 on Dec 25

## Common Issues

### Port Already in Use
```bash
# Kill process using port 5000 (Windows PowerShell)
Get-Process | Where-Object { $_.Port -eq 5000 } | Stop-Process

# Or change PORT in .env
PORT=5001
```

### MongoDB Connection Failed
1. Install MongoDB locally from mongodb.com
2. Start MongoDB service
3. Or use MongoDB Atlas (free cloud)

### Admin Panel won't load
1. Check backend is running on port 5000
2. Verify VITE_API_URL in .env
3. Hard refresh browser (Ctrl+Shift+R)

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vksha.com | change_me |

## Quick Commands

```bash
# Build for production
cd backend && npm run build
cd admin && npm run build
cd mobile && npm run build-ios / build-android

# Stop all services
Ctrl+C in each terminal

# Clear cache
cd admin && npm run dev -- --reset-cache
cd mobile && npm start -- --reset-cache

# Check if ports are open
netstat -ano | findstr :5000
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

## Testing the APIs

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vksha.com","password":"change_me"}'

# Get leaderboard
curl http://localhost:5000/api/users/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What's Running?

- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3001
- **Mobile App**: Via Expo Go on your phone

## Database

- MongoDB collections automatically created
- Default indices already applied
- Sample data can be imported via Excel

## Next: Deployment

Once you've verified everything works:

1. Follow `DEPLOYMENT.md` for production setup
2. Use MongoDB Atlas for database
3. Deploy backend to Render
4. Deploy admin to Vercel
5. Build mobile apps for distribution

---

That's it! You're ready to go. Happy coding! 🚀
