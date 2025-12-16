# API Testing Guide - Vksha Family Event Management System

## Overview
This guide provides comprehensive instructions for testing all backend API endpoints. The backend uses Express.js with in-memory storage and JWT authentication.

---

## 1. Authentication & Setup

### 1.1 Required Headers
All protected endpoints require:
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

### 1.2 Environment Variables
Create `.env` in the `backend/` directory:
```
PORT=5000
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081
```

---

## 2. Authentication Endpoints

### 2.1 Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Expected Response:** 201
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Cases:**
- ✓ Valid registration with all fields
- ✓ Reject if email already exists
- ✓ Reject if phone already exists
- ✓ Reject if password is weak
- ✓ Reject if required fields missing

---

### 2.2 Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response:** 200
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Cases:**
- ✓ Valid login returns JWT token
- ✓ Invalid email returns 404
- ✓ Invalid password returns 401
- ✓ Token is valid JWT format

---

## 3. User Management Endpoints

### 3.1 Get Current User Profile
**GET** `/api/users/profile`

**Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Expected Response:** 200
```json
{
  "_id": "abc123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "user",
  "familyId": "fam123",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Test Cases:**
- ✓ Returns current user without password
- ✓ Reject if no token provided (401)
- ✓ Reject if invalid token (401)

---

### 3.2 Update User Profile
**PUT** `/api/users/profile`

**Headers:** Include Authorization

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1987654321"
}
```

**Expected Response:** 200
```json
{
  "message": "Profile updated successfully",
  "user": { ...updated user data... }
}
```

**Test Cases:**
- ✓ Update single field
- ✓ Update multiple fields
- ✓ Reject if email already taken
- ✓ Reject if phone already taken
- ✓ Preserve unchanged fields

---

### 3.3 Get User Leaderboard
**GET** `/api/users/leaderboard`

**Query Parameters:**
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Expected Response:** 200
```json
{
  "total": 50,
  "users": [
    {
      "_id": "user1",
      "firstName": "Alice",
      "lastName": "Johnson",
      "totalPoints": 5000,
      "rank": 1
    },
    {
      "_id": "user2",
      "firstName": "Bob",
      "lastName": "Smith",
      "totalPoints": 4500,
      "rank": 2
    }
  ]
}
```

**Test Cases:**
- ✓ Returns users sorted by points (descending)
- ✓ Includes rank calculation
- ✓ Respects limit parameter
- ✓ Respects offset parameter
- ✓ Returns 0 users for empty system

---

## 4. Family Management Endpoints

### 4.1 Get All Families (Admin Only)
**GET** `/api/bulk/families`

**Headers:** Include Authorization (admin required)

**Expected Response:** 200
```json
[
  {
    "_id": "fam1",
    "name": "Johnson Family",
    "description": "Family group: Johnson Family",
    "members": ["user1", "user2", "user3"],
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

**Test Cases:**
- ✓ Admin can view all families
- ✓ Non-admin users are rejected (403)
- ✓ Returns empty array if no families
- ✓ Includes member count/list

---

### 4.2 Import Families from Excel (Admin Only)
**POST** `/api/bulk/import-families`

**Headers:** 
```json
{
  "Authorization": "Bearer <ADMIN_TOKEN>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**
- `file`: Excel file with columns: `familyName`, `firstName`, `lastName`, `email`, `phone`

**Expected Response:** 200
```json
{
  "usersCreated": 15,
  "familiesCreated": 3,
  "errors": []
}
```

**Excel File Format:**
```
familyName | firstName | lastName | email              | phone
Johnson    | John      | Johnson  | john@example.com   | +1234567890
Johnson    | Jane      | Johnson  | jane@example.com   | +1987654321
Smith      | Bob       | Smith    | bob@example.com    | +1555555555
Smith      | Carol     | Smith    | carol@example.com  | +1666666666
```

**Test Cases:**
- ✓ Imports valid Excel file
- ✓ Groups users by family
- ✓ Creates families and users atomically
- ✓ Rejects if no file provided (400)
- ✓ Handles duplicate entries
- ✓ Returns error list for partial failures
- ✓ Admin-only access (403 for non-admin)
- ✓ Sets default password for new users
- ✓ Creates FamilyNode entries for each user

---

## 5. Stall Management Endpoints

### 5.1 Create Stall (Admin Only)
**POST** `/api/bulk/stalls`

**Headers:** Include Authorization (admin required)

**Request:**
```json
{
  "name": "Food Stall A",
  "type": "food",
  "shopkeeperId": "shopkeeper123",
  "pointsPerTransaction": 10
}
```

**Expected Response:** 201
```json
{
  "message": "Stall created",
  "stall": {
    "_id": "stall1",
    "name": "Food Stall A",
    "type": "food",
    "shopkeeperId": "shopkeeper123",
    "pointsPerTransaction": 10,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Test Cases:**
- ✓ Admin can create stall
- ✓ Non-admin rejected (403)
- ✓ Requires name and type
- ✓ Uses default pointsPerTransaction if not provided
- ✓ Associates with shopkeeper correctly

---

## 6. Points Management Endpoints

### 6.1 Award Points to User
**POST** `/api/points/award`

**Headers:** Include Authorization (admin/shopkeeper required)

**Request:**
```json
{
  "userId": "user123",
  "points": 100,
  "reason": "Purchase at stall",
  "stalId": "stall1"
}
```

**Expected Response:** 200
```json
{
  "message": "Points awarded successfully",
  "transaction": {
    "_id": "trans1",
    "userId": "user123",
    "points": 100,
    "reason": "Purchase at stall",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Test Cases:**
- ✓ Awards points to user
- ✓ Creates transaction record
- ✓ Updates user's total points
- ✓ Only admin/shopkeeper can award
- ✓ Rejects if user doesn't exist
- ✓ Rejects if points <= 0

---

### 6.2 Get User Points History
**GET** `/api/points/history/:userId`

**Headers:** Include Authorization

**Expected Response:** 200
```json
{
  "userId": "user123",
  "totalPoints": 500,
  "transactions": [
    {
      "_id": "trans1",
      "points": 100,
      "reason": "Purchase at stall",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "_id": "trans2",
      "points": 400,
      "reason": "Event participation",
      "createdAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

**Test Cases:**
- ✓ Returns all transactions for user
- ✓ Calculates total correctly
- ✓ Returns empty array if no transactions
- ✓ Transactions are sorted by date (newest first)

---

## 7. Admin Endpoints

### 7.1 Get System Statistics
**GET** `/api/admin/stats`

**Headers:** Include Authorization (admin required)

**Expected Response:** 200
```json
{
  "totalUsers": 50,
  "totalFamilies": 10,
  "totalPoints": 25000,
  "totalStalls": 5,
  "totalTransactions": 200,
  "topUsers": [
    { "firstName": "Alice", "totalPoints": 5000 },
    { "firstName": "Bob", "totalPoints": 4500 }
  ]
}
```

**Test Cases:**
- ✓ Admin can view stats
- ✓ Non-admin rejected (403)
- ✓ Calculations are accurate
- ✓ Top users are correct

---

## 8. Testing Workflow

### Step 1: Setup
1. Start the backend: `npm run dev`
2. Verify health check: `GET http://localhost:5000/api/health`

### Step 2: Authentication Flow
1. Register admin user with role: "admin"
2. Register regular user with role: "user"
3. Login and save JWT tokens for both users

### Step 3: Family & User Management
1. Upload Excel file with families
2. Verify families created
3. Get all users via admin endpoint

### Step 4: Stall Setup
1. Create stalls as admin
2. Assign shopkeepers to stalls

### Step 5: Points System
1. Award points to users
2. Check leaderboard
3. View transaction history

### Step 6: Validation
1. Verify authentication restrictions
2. Test authorization (admin-only endpoints)
3. Check data consistency

---

## 9. Postman Collection Setup

### Import Variables
```json
{
  "adminToken": "your-admin-jwt-here",
  "userToken": "your-user-jwt-here",
  "baseUrl": "http://localhost:5000/api",
  "userId": "user-id-here"
}
```

### Example Request
```
POST {{baseUrl}}/points/award
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "userId": "{{userId}}",
  "points": 100,
  "reason": "Test points"
}
```

---

## 10. Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body format and required fields |
| 401 | Unauthorized | Provide valid JWT token in Authorization header |
| 403 | Forbidden | Use account with appropriate role (admin/shopkeeper) |
| 404 | Not Found | Resource doesn't exist or was deleted |
| 500 | Server Error | Check server logs for details |

### Example Error Response
```json
{
  "message": "Admin access required"
}
```

---

## 11. Performance Testing

### Load Testing Endpoints
- `/api/users/leaderboard` - Test with large user counts
- `/api/bulk/import-families` - Test with 1000+ records

### Expected Performance
- Authentication: < 100ms
- User lookup: < 50ms
- Leaderboard calculation: < 500ms (for 1000 users)
- Import: < 5s (for 1000 records)

---

## 12. Security Testing

### Test Cases
- ✓ SQL Injection attempts on search fields
- ✓ XSS attempts in user input
- ✓ Token tampering
- ✓ Rate limiting (100 requests per 15 minutes)
- ✓ CORS origin validation
- ✓ Password hashing verification
- ✓ Admin endpoint access control

---

## 13. Data Integrity Testing

### Atomic Operations
- Family creation should always include user creation
- Points awarded should create transaction record
- User update should not affect other users

### Consistency Checks
- User count in family should match actual users
- Total points should equal sum of transactions
- Leaderboard ranking should be unique and sequential

---

## 14. Continuous Integration Testing

### Test Suite Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- users.test.ts

# Run with coverage
npm test -- --coverage
```

### CI/CD Pipeline
1. Lint code: `npm run lint`
2. Build: `npm run build`
3. Run tests: `npm test`
4. Deploy to staging

---

## Troubleshooting

### Issue: "Invalid token"
**Solution:** 
- Ensure JWT_SECRET matches in .env
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### Issue: "Admin access required"
**Solution:**
- Use admin account for protected endpoints
- Verify user's role is "admin" in database

### Issue: "No file provided"
**Solution:**
- Use multipart/form-data for file uploads
- Attach file with form key "file"

### Issue: CORS errors
**Solution:**
- Check CORS_ORIGIN in .env matches your frontend URL
- Restart server after changing .env

---

## Contact & Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Review error messages in API responses
3. Verify environment variables are set correctly
4. Check database/storage state

---

**Last Updated:** January 15, 2024
**Version:** 1.0
