# Super User Access Update

## Problem Fixed
Super users (users with `isSuperUser: true` flag) were unable to create carnival stalls and perform admin actions because the system was only checking for `role === 'admin'`.

## Solution Implemented

### 1. **Token Generation Enhanced**
- Updated `generateToken()` to include `isSuperUser` flag
- Token payload now includes: `{ id, role, isSuperUser }`
- Super user status is now part of the authentication token

### 2. **Middleware Updated**
All middleware functions now check for both admin role AND super user flag:

#### `adminMiddleware`
```typescript
// Before
if (req.user?.role !== 'admin')

// After
if (req.user?.role !== 'admin' && !req.user?.isSuperUser)
```

#### `shopkeeperMiddleware`
```typescript
// Before
if (req.user?.role !== 'shopkeeper' && req.user?.role !== 'admin')

// After
if (req.user?.role !== 'shopkeeper' && req.user?.role !== 'admin' && !req.user?.isSuperUser)
```

### 3. **Carnival Admin Controller Updated**
All 5 admin-only functions now allow super users:

1. **createCarnivalEvent** - Super users can create stalls/games
2. **updateCarnivalEvent** - Super users can edit stalls
3. **toggleEventStatus** - Super users can open/close stalls
4. **deleteCarnivalEvent** - Super users can delete stalls
5. **getEventParticipations** - Super users can view participations

All checks changed from:
```typescript
if (!user || user.role !== 'admin')
```
To:
```typescript
if (!user || (user.role !== 'admin' && !user.isSuperUser))
```

### 4. **Auth Controller Updated**
- Login endpoint now includes `isSuperUser` in token
- Login response now includes `isSuperUser` in user object
- Register endpoint passes `isSuperUser` to token generation

## How Super User Works

### Creating Super User
Super users are created during registration with special flag:
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "password": "secure123",
  "phone": "1234567890",
  "house": "Kadannamanna",
  "isSuperUser": true  // This flag makes them super user
}
```

### Login Response
When a super user logs in, they receive:
```json
{
  "token": "jwt_token_with_isSuperUser_flag",
  "user": {
    "id": "user_id",
    "role": "user",  // Can be any role
    "isSuperUser": true,  // Super user flag
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com"
  }
}
```

### Permissions Hierarchy

**Super User (isSuperUser: true)**
- ✅ Can do EVERYTHING admins can do
- ✅ Can create carnival events/stalls
- ✅ Can edit any carnival event
- ✅ Can delete carnival events
- ✅ Can toggle event status (open/close)
- ✅ Can view all participations
- ✅ Can manage users
- ✅ Bypasses ALL role restrictions

**Admin (role: 'admin')**
- ✅ Can create carnival events/stalls
- ✅ Can edit carnival events
- ✅ Can delete carnival events
- ✅ Can manage users
- ✅ Admin-level permissions

**Regular User (role: 'user')**
- ❌ Cannot create stalls
- ❌ Cannot edit events
- ✅ Can participate in events
- ✅ Can view their profile

## Testing Super User

### 1. Create Super User Account
```bash
POST /api/auth/register
{
  "firstName": "Super",
  "lastName": "Admin",
  "email": "super@admin.com",
  "password": "SecurePass123",
  "phone": "9876543210",
  "house": "Kadannamanna",
  "isSuperUser": true
}
```

### 2. Login as Super User
```bash
POST /api/auth/login
{
  "email": "super@admin.com",
  "password": "SecurePass123"
}
```

### 3. Use Token for Admin Actions
The returned token now has super user permissions. Use it to:
- Create carnival stalls
- Edit events
- Delete events
- Manage users
- Everything admins can do

## Files Changed

### Backend
1. `src/utils/auth.ts` - Updated `generateToken()` signature
2. `src/middleware/auth.ts` - Updated all middleware to check `isSuperUser`
3. `src/controllers/authController.ts` - Pass `isSuperUser` to token generation
4. `src/controllers/carnivalAdminController.ts` - Check `isSuperUser` in all admin functions

### Summary
✅ Super users now have complete admin access
✅ All carnival stall operations work for super users
✅ User management works for super users
✅ Token includes super user flag
✅ Middleware enforces super user permissions

## Notes
- Super users are a **superset** of admins
- `isSuperUser: true` bypasses role checks
- Super users can have ANY role (user/admin/shopkeeper) and still have full access
- This is useful for system administrators who need god-mode access
