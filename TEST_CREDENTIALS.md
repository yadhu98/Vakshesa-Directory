# 🔐 Test Credentials - Vksha Family Event Management System

**Created**: November 29, 2025
**Status**: ✅ Active & Verified

---

## 👨‍💼 Admin User (Admin Panel)

### Credentials
```
Email:    admin@vksha.com
Password: Admin@12345
Role:     admin
```

### Admin Panel Access
- **URL**: http://localhost:3001
- **Features Available**:
  - ✅ View all users
  - ✅ Create families
  - ✅ Import users from Excel
  - ✅ Award points to users
  - ✅ Create stalls
  - ✅ View system statistics
  - ✅ View leaderboard

### Admin Details
```json
{
  "firstName": "Admin",
  "lastName": "Dashboard",
  "email": "admin@vksha.com",
  "phone": "+919876543210",
  "role": "admin"
}
```

---

## 👤 Regular User (Mobile App)

### Credentials
```
Email:    user@vksha.com
Password: User@12345
Role:     user
```

### Mobile App Access
- **URL**: http://localhost:19006
- **Features Available**:
  - ✅ Login / Logout
  - ✅ View profile
  - ✅ View leaderboard
  - ✅ See points balance
  - ✅ View points history

### User Details
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@vksha.com",
  "phone": "+919876543211",
  "role": "user"
}
```

---

## 🔗 Quick Links

| Application | URL | Credentials | Purpose |
|-------------|-----|-------------|---------|
| **Admin Dashboard** | http://localhost:3001 | admin@vksha.com / Admin@12345 | Manage system |
| **Mobile App** | http://localhost:19006 | user@vksha.com / User@12345 | View leaderboard |
| **Backend API** | http://localhost:5000/api | (Bearer token) | API endpoints |

---

## 🧪 Testing Workflow

### 1. Admin Tasks
```bash
# Login to admin panel
URL: http://localhost:3001
Email: admin@vksha.com
Password: Admin@12345

# Available actions:
- Import families from Excel
- Create stalls
- Award points to users
- View all users
```

### 2. User Tasks
```bash
# Login to mobile app
URL: http://localhost:19006
Email: user@vksha.com
Password: User@12345

# Available actions:
- View leaderboard
- See your points
- View profile
```

### 3. API Testing
```bash
# Get authentication token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vksha.com",
    "password": "Admin@12345"
  }'

# Response includes JWT token:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Use token for authenticated requests:
curl -X GET http://localhost:5000/api/users/leaderboard \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Password Requirements

All passwords meet security requirements:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 number
- ✅ Contain letters and numbers

---

## 🔒 Security Information

### Password Hashing
- **Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Storage**: Hashed (never plaintext)

### JWT Tokens
- **Duration**: 24 hours
- **Algorithm**: HS256
- **Secret**: Configured in backend/.env

### Account Security
- **Lockout**: After 5 failed login attempts
- **Unlock Time**: 15 minutes
- **Audit Log**: All logins recorded

---

## ✅ Verification Checklist

- [x] Admin user created and verified
- [x] Mobile user created and verified
- [x] Both can login successfully
- [x] JWT tokens generated correctly
- [x] Passwords hashed securely
- [x] Roles assigned properly

---

## 📝 Additional Test Users

To create additional users for testing:

### Option 1: Manual Registration (API)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@vksha.com",
    "phone": "+919876543212",
    "password": "Test@12345",
    "role": "user"
  }'
```

### Option 2: Bulk Import (Excel)
1. Login as admin
2. Create Excel file with columns: familyName, firstName, lastName, email, phone
3. Upload via admin panel
4. Users created with password: `default123`

---

## 🔄 Testing Scenarios

### Scenario 1: Family Management
1. Login as admin
2. Import families from Excel
3. Create a stall
4. Assign shopkeeper

### Scenario 2: Points & Leaderboard
1. Login as admin
2. Award points to users
3. Login as user
4. Check leaderboard position

### Scenario 3: Full Workflow
1. Admin imports 10 families
2. Admin creates stalls
3. Users login and view leaderboard
4. Points are awarded
5. Leaderboard updates in real-time

---

## 🆘 Troubleshooting

### Login Not Working
- **Check**: Email and password are correct
- **Check**: Backend API is running (http://localhost:5000/api/health)
- **Solution**: Clear browser cache and try again

### Dashboard Not Loading
- **Check**: Admin panel is running (http://localhost:3001)
- **Check**: Admin has correct role (admin)
- **Solution**: Refresh page or login again

### Mobile App Not Showing Points
- **Check**: User is logged in
- **Check**: Backend has points data
- **Solution**: Award points via admin panel and refresh

---

## 📞 Support

For issues or questions:
1. Check `API_TESTING_GUIDE.md` for API documentation
2. Review `QA_TESTING_CHECKLIST.md` for test cases
3. Check backend logs: `npm run dev` output
4. Verify all services are running on correct ports

---

**Last Updated**: November 29, 2025
**Version**: 1.0
**Status**: ✅ Ready for Testing
