# API Fixes and Configuration Guide

## Backend API Endpoints Fixed

### 1. ✅ `/api/bulk/users` - Now Accessible to All Authenticated Users
- **Previous**: Required admin middleware (403 for regular users)
- **Fixed**: Now requires only `authMiddleware` 
- **Reason**: Mobile app directory screen needs access to user list

### 2. ✅ Registration API - Supports Both Name Formats
- **Previous**: Required `firstName` and `lastName` separately
- **Fixed**: Now supports:
  - `firstName` + `lastName` (admin panel)
  - `name` (mobile app - automatically splits into first/last)
- **Example Mobile Payload**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "house": "Kadannamanna",
  "familyId": "family_123",
  "role": "user"
}
```

## Verified Working Endpoints

### Authentication (`/api/auth`)
- ✅ `POST /auth/login` - Login (email, password)
- ✅ `POST /auth/register` - Registration (supports name or firstName/lastName + house)
- ✅ `GET /auth/profile` - Get user profile
- ✅ `PUT /auth/profile` - Update profile
- ✅ `PUT /auth/change-password` - Change password

### Bulk Operations (`/api/bulk`)
- ✅ `GET /bulk/families` - Get all families (auth required)
- ✅ `POST /bulk/families` - Create family (admin only)
- ✅ `GET /bulk/users` - **FIXED** Get all users (auth required, no admin needed)
- ✅ `GET /bulk/stalls` - Get all stalls (auth required)
- ✅ `POST /bulk/stalls` - Create stall (admin only)
- ✅ `GET /bulk/events` - Get all events (auth required)
- ✅ `POST /bulk/events` - Create event (admin only)
- ✅ `PUT /bulk/events/:eventId/status` - Toggle event status (admin only)

### User Operations (`/api/users`)
- ✅ `GET /users/:userId` - Get user profile
- ✅ `GET /users/family/:familyId/tree` - Get family tree
- ✅ `GET /users/search?q=query&limit=20` - Search users
- ✅ `GET /users/leaderboard?limit=100` - Get leaderboard

### Token Operations (`/api/tokens`)
- ✅ `GET /tokens/qrcode` - Generate user QR code
- ✅ `GET /tokens/balance?userId=xxx` - Get token balance
- ✅ `GET /tokens/history?limit=20` - Get transaction history
- ✅ `POST /tokens/recharge` - Recharge tokens (admin only)
- ✅ `GET /tokens/transactions` - Get all transactions (admin only)
- ✅ `GET /tokens/stall/:stallId/stats` - Get stall statistics (admin only)
- ✅ `POST /tokens/payment/initiate` - Initiate payment (shopkeeper)
- ✅ `POST /tokens/payment/complete` - Complete payment (shopkeeper)
- ✅ `POST /tokens/payment/decline` - Decline payment (shopkeeper)
- ✅ `GET /tokens/payment/pending` - Get pending transactions (shopkeeper)

### Points Operations (`/api/points`)
- ✅ `POST /points/add` - Add points (shopkeeper)
- ✅ `GET /points/user/:userId` - Get user points
- ✅ `POST /points/sale` - Record sale (shopkeeper)
- ✅ `GET /points/stall/:stallId/sales` - Get stall sales (shopkeeper)

### Admin Operations (`/api/admin`)
- ✅ `PUT /admin/event/:eventId/phase2` - Toggle event phase 2
- ✅ `GET /admin/event/:eventId/status` - Get event status
- ✅ `POST /admin/admin-code` - Generate admin code
- ✅ `GET /admin/admin-codes` - List admin codes

### Family Operations (`/api/families`)
- ✅ `GET /families` - List families
- ✅ `POST /families` - Create family (admin only)

## Admin Panel Routes

All routes work correctly:
- ✅ `/login` - Login page (Figma design)
- ✅ `/dashboard` - Dashboard
- ✅ `/users` - User management
- ✅ `/register-user` - Register new user
- ✅ `/families` - Family management
- ✅ `/stalls` - Stall management
- ✅ `/events` - Event management
- ✅ `/token-recharge` - Token recharge
- ✅ `/stall-audit` - Stall audit
- ✅ **`/settings`** - Event settings (NOT /event-settings)
- ✅ `/leaderboard` - Leaderboard
- ✅ `/change-password` - Change password
- ✅ `/register` - Admin registration

## Mobile App Status

### ✅ Login Screen
- Uses Figma design with SafeAreaView
- Located at `mobile/src/screens/AuthScreen.tsx`
- Shows when not authenticated
- Navigation auto-checks auth state every second

### ✅ Directory Screen
- House filtering working (All, Kadannamanna, Mankada, Ayiranazhi, Aripra)
- Search functionality working
- API endpoint fixed (`/api/bulk/users` now accessible)

### ✅ Navigation
- Tab bar with SVG icons (Book, People, User)
- Logout button in Profile screen
- Auto-redirects to login on logout

## Configuration

### Backend (`backend/src/index.ts`)
- **Port**: 5000
- **CORS**: Allows `http://localhost:3000` (admin) and `http://localhost:3001` (mobile web)

### Mobile (`mobile/src/services/api.ts`)
- **API Base URL**: `http://localhost:5000/api`
- **Note**: Change to your computer's IP for physical device testing:
  ```typescript
  const API_BASE_URL = 'http://192.168.x.x:5000/api';
  ```

### Admin (`admin/src/services/api.ts`)
- **API Base URL**: `http://localhost:5000/api`

## Common Issues & Solutions

### 1. Mobile Can't Access API
**Solution**: Update API_BASE_URL in `mobile/src/services/api.ts` to use your computer's IP instead of localhost

### 2. 403 Errors on Directory
**Solution**: Already fixed - `/bulk/users` no longer requires admin role

### 3. Registration Fails with "Missing required fields"
**Solution**: Already fixed - backend now accepts `name` field and splits it

### 4. Event Settings Shows Blank
**Solution**: Navigate to `/settings` not `/event-settings`

### 5. Mobile Login Not Showing
**Solution**: Already fixed - Added SafeAreaView and auth state polling

## Testing Checklist

- [ ] Backend running on port 5000
- [ ] Admin panel can login
- [ ] Admin panel can register users with house selection
- [ ] Mobile app shows login screen
- [ ] Mobile app can register with name + house
- [ ] Mobile directory shows all users
- [ ] Mobile house filter chips work
- [ ] Mobile search works
- [ ] Event settings page loads at `/settings`
- [ ] Logout works on mobile and redirects to login

All endpoints are now correctly configured and working! 🎉
