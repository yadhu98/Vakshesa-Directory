# Quick Start Guide - Testing Your System

## 🚀 Starting All Services

### 1. Start Backend Server
```powershell
cd backend
npm install
npm run dev
```
**Expected:** Server running on `http://localhost:5000`

### 2. Start Admin Panel
```powershell
cd admin
npm install
npm run dev
```
**Expected:** Admin panel on `http://localhost:3001`

### 3. Start Mobile App
```powershell
cd mobile
npm install
npm install @react-native-picker/picker expo-barcode-scanner
npx expo start
```
**Expected:** Expo DevTools opens, scan QR with Expo Go app

---

## 🧪 Testing Workflow

### Step 1: Create Admin Account

1. **Generate Admin Code**
   - Open: `http://localhost:3001/register` (public page, no login required)
   - Note: You need a validation code first

2. **Get Validation Code**
   - This is tricky - you need an existing admin to generate codes
   - **Workaround:** Manually insert admin code in database:
   
   **Option A: Use Backend Console**
   ```powershell
   cd backend/src
   node -e "const db = require('./config/storage').db; db.insert('admincodes', {_id: 'code_test', code: '123456', expiresAt: new Date(Date.now() + 3600000).toISOString(), isUsed: false});"
   ```
   
   **Option B: Create Bootstrap Admin**
   - Modify `backend/src/index.ts` temporarily to create first admin on startup
   - Add this code before `app.listen()`:
   ```typescript
   // Bootstrap first admin (remove after first run)
   (async () => {
     const adminExists = await db.findOne('users', { role: 'admin' });
     if (!adminExists) {
       const { hashPassword } = require('./utils/auth');
       await db.insert('users', {
         _id: 'admin_bootstrap',
         email: 'admin@vksha.com',
         password: await hashPassword('admin123'),
         name: 'System Admin',
         role: 'admin',
         familyId: 'family_default',
         createdAt: new Date().toISOString(),
       });
       console.log('✅ Bootstrap admin created: admin@vksha.com / admin123');
     }
   })();
   ```

3. **Register Admin**
   - Use code: `123456`
   - Email: `admin@vksha.com`
   - Password: `admin123`

### Step 2: Login to Admin Panel

1. Navigate to `http://localhost:3001/login`
2. Login with admin credentials
3. You should see the Dashboard

### Step 3: Set Up Families

1. Go to **Families** page
2. Click **+ Add Family**
3. Create families:
   - Name: "Smith Family", Description: "The Smiths"
   - Name: "Johnson Family", Description: "The Johnsons"
   - Name: "Williams Family", Description: "The Williams"

### Step 4: Create Event

1. Go to **Events** page
2. Click **+ Create Event**
3. Fill in:
   - Name: "Christmas Carnival 2024"
   - Description: "Annual family carnival"
4. Click **Activate** to enable the event

### Step 5: Configure Tokens

1. Go to **Event Settings** (⚙️)
2. Under **Token Configuration**:
   - Select your event
   - Set Amount to Token Ratio: `2` (₹1 = 2 tokens)
   - Min Recharge: `10`
   - Max Recharge: `1000`
   - Default Amount: `50`
3. Click **Save Token Configuration**

### Step 6: Create Stalls

1. Go to **Stalls** page
2. Create stalls for testing:
   - Name: "Ring Toss", Type: "Game", Points: 10
   - Name: "Food Corner", Type: "Food", Points: 5
   - Name: "Photo Booth", Type: "Service", Points: 3

### Step 7: Register Users (Admin Panel)

1. Go to **Register User** page
2. Create test users:
   
   **User 1:**
   - Name: "John Smith"
   - Email: "john@test.com"
   - Password: "test123"
   - Phone: "+1234567890"
   - Profession: "Engineer"
   - Family: "Smith Family"
   - Role: "user"
   
   **User 2:**
   - Name: "Jane Johnson"
   - Email: "jane@test.com"
   - Password: "test123"
   - Family: "Johnson Family"
   - Role: "user"
   
   **Shopkeeper 1:**
   - Name: "Bob Shopkeeper"
   - Email: "shopkeeper@test.com"
   - Password: "test123"
   - Family: "Williams Family"
   - Role: "shopkeeper"

### Step 8: Test Mobile App

#### A. Register User from Mobile

1. Open mobile app (Expo Go)
2. Tap **Register** tab
3. Fill in details:
   - Name: "Alice Williams"
   - Email: "alice@test.com"
   - Phone: "+9876543210"
   - Profession: "Doctor"
   - Family: Select "Williams Family"
   - Password: "test123"
   - Confirm Password: "test123"
4. Tap **Create Account**

#### B. Login and Explore

1. Login with: `alice@test.com` / `test123`
2. Explore screens:
   - **🎪 Carnival Tab:** View token balance (should be 0)
   - **📖 Directory Tab:** See all registered members
   - **🌳 Tree Tab:** View family tree (if nodes created)
   - **👤 Profile Tab:** View/edit your profile

### Step 9: Test Token Recharge

1. **Admin Panel: Token Recharge**
2. Search for user: "Alice Williams"
3. Enter token amount: `100`
4. Click **Recharge Tokens**
5. **Mobile App:** Pull down to refresh Carnival Wallet tab
6. **Expected:** Balance shows 100 tokens

### Step 10: Test QR Payment Flow

#### Option A: User Scans Shopkeeper (Recommended)

1. **Admin Panel:** Create QR for shopkeeper
   - Go to Token Recharge
   - Search "Bob Shopkeeper"
   - Generate QR code (you'll need to modify this to generate shopkeeper QR)

2. **Mobile App (User):**
   - Go to Carnival > **Scan** tab
   - Tap "Start Scanning"
   - Scan shopkeeper QR code
   - Payment initiated

3. **Shopkeeper Screen:**
   - Login as shopkeeper on another device
   - See pending transaction
   - Enter game score
   - Accept or decline payment

#### Option B: Test with Existing Flow

1. **Mobile App (Shopkeeper):**
   - Login as: `shopkeeper@test.com` / `test123`
   - Scan user's QR from their Wallet tab
   - Complete transaction

### Step 11: Verify Leaderboard

1. **Mobile App:** Go to Carnival > **Leaderboard** tab
2. **Expected:** See ranked users with points
3. Top 3 should have medal icons 🥇🥈🥉

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**
1. Check backend is running: `http://localhost:5000/api`
2. Mobile app: Update `mobile/src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
   // Example: 'http://192.168.1.100:5000/api'
   ```
3. Find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Issue: "404 errors on API calls"

**Solution:**
1. Verify backend is running
2. Check browser console for exact endpoint
3. Verify endpoint exists in backend routes

### Issue: "403 Forbidden"

**Solution:**
1. Check if logged in (token stored)
2. Verify user role matches endpoint requirement:
   - Admin endpoints → admin role
   - Shopkeeper endpoints → shopkeeper role

### Issue: "Mobile app not loading"

**Solution:**
1. Run `npx expo start --clear`
2. Ensure dependencies installed: `npm install`
3. Check for React Native errors in terminal

### Issue: "QR Scanner not working"

**Solution:**
1. Grant camera permissions in phone settings
2. iOS: Add camera usage description in `app.json`
3. Android: Permissions auto-requested

---

## 📱 Testing on Physical Device

### Update API Base URL

1. **Find Your Computer's IP:**
   ```powershell
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.1.100`)

2. **Update Mobile API Config:**
   ```typescript
   // mobile/src/services/api.ts
   const API_BASE_URL = 'http://192.168.1.100:5000/api';
   ```

3. **Restart Expo:**
   ```powershell
   npx expo start --clear
   ```

4. **Ensure Same Network:**
   - Phone and computer must be on same WiFi
   - Disable firewall if connection fails

---

## 🎯 Test Scenarios

### Scenario 1: Complete User Journey

1. Register user from mobile
2. Admin recharges tokens
3. User scans shopkeeper at stall
4. Shopkeeper accepts payment with score
5. User sees updated balance
6. Leaderboard updates with points

### Scenario 2: Admin Management

1. Create event
2. Configure token pricing
3. Create families
4. Register users
5. Create stalls
6. Generate admin code
7. Audit transactions (Stall Audit page)
8. Export transaction CSV

### Scenario 3: Family Exploration

1. Register multiple users in same family
2. View directory, filter by family
3. Tap member to view profile
4. View family tree (requires backend family nodes)

---

## 📊 Expected Results

### After Full Setup:

- ✅ 3+ families created
- ✅ 1 active event
- ✅ 3+ stalls created
- ✅ 5+ users registered (mix of regular + shopkeeper)
- ✅ Token configuration saved
- ✅ Users can login on mobile
- ✅ Directory shows all members
- ✅ Carnival event is visible and active
- ✅ QR codes generated
- ✅ Transactions recorded
- ✅ Leaderboard populated

---

## 🔐 Test Credentials Summary

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@vksha.com | admin123 | Bootstrap admin |
| User | john@test.com | test123 | Smith Family |
| User | jane@test.com | test123 | Johnson Family |
| User | alice@test.com | test123 | Williams Family |
| Shopkeeper | shopkeeper@test.com | test123 | Ring Toss stall |

---

## 🎉 Success Indicators

✅ **Backend Health Check:**
- Visit `http://localhost:5000/api`
- Should return "Vksha API is running"

✅ **Admin Panel Working:**
- Can login
- All pages load
- No console errors
- Token recharge works

✅ **Mobile App Working:**
- Can register/login
- All 4 tabs visible (user) or 2 tabs (shopkeeper)
- Directory shows members
- Carnival shows active event
- QR scanner opens camera

✅ **End-to-End Flow:**
- User receives tokens from admin
- User can scan shopkeeper QR
- Payment processes successfully
- Points reflected in leaderboard

---

**Ready to Test! 🚀**

Start with the bootstrap admin, then follow the workflow step-by-step. If you encounter issues, refer to the troubleshooting section.
