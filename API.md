# API Documentation

Complete API reference for the Vksha Event Management System.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://vksha-backend.onrender.com/api`

## Authentication

All endpoints (except `/auth/login`) require JWT token in header:

```
Authorization: Bearer <token>
```

Token is obtained from login endpoint and typically expires in 7 days.

## Response Format

All responses return JSON:

### Success Response
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "message": "Error description",
  "stack": "Error trace (development only)"
}
```

## Endpoints

### Auth Endpoints

#### Login
```
POST /auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "familyId": "507f1f77bcf86cd799439012"
  }
}
```

**Status Codes**
- `200`: Login successful
- `400`: Missing email or password
- `401`: Invalid credentials

---

#### Get Profile
```
GET /auth/profile
```

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "role": "user",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "isActive": true,
  "createdAt": "2024-12-01T10:30:00Z",
  "updatedAt": "2024-12-01T10:30:00Z"
}
```

---

#### Update Profile
```
PUT /auth/profile
```

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male"
}
```

**Response (200)**
```json
{
  "message": "Profile updated successfully",
  "user": {...}
}
```

---

### User Endpoints

#### Get User Profile
```
GET /users/:userId
```

**Path Parameters**
- `userId` (required): User ID

**Response (200)**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "familyId": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Sharma Family",
    "members": [...]
  },
  "role": "user"
}
```

---

#### Get Family Tree
```
GET /users/family/:familyId/tree
```

**Path Parameters**
- `familyId` (required): Family ID

**Response (200)**
```json
{
  "tree": {
    "507f1f77bcf86cd799439011": {
      "userId": {...},
      "generation": 0,
      "relationshipType": "father",
      "children": [...]
    }
  },
  "totalMembers": 15
}
```

---

#### Search Users
```
GET /users/search
```

**Query Parameters**
- `q` (required): Search query
- `limit` (optional): Result limit (default: 20)

**Example**
```
GET /users/search?q=john&limit=10
```

**Response (200)**
```json
{
  "query": "john",
  "count": 3,
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

---

#### Get Leaderboard
```
GET /users/leaderboard
```

**Query Parameters**
- `limit` (optional): Number of ranks to return (default: 100)

**Example**
```
GET /users/leaderboard?limit=50
```

**Response (200)**
```json
{
  "totalRanked": 50,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "507f1f77bcf86cd799439011",
      "userName": "John Doe",
      "totalPoints": 850,
      "profilePicture": "https://..."
    },
    {
      "rank": 2,
      "userId": "507f1f77bcf86cd799439012",
      "userName": "Jane Smith",
      "totalPoints": 820,
      "profilePicture": "https://..."
    }
  ]
}
```

---

### Points Endpoints

#### Add Points
```
POST /points/add
```

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role**: `shopkeeper` or `admin`

**Request Body**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "stallId": "507f1f77bcf86cd799439012",
  "points": 50,
  "qrCodeData": "optional_qr_code_data"
}
```

**Response (200)**
```json
{
  "message": "Points added successfully",
  "point": {
    "id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "stallId": "507f1f77bcf86cd799439012",
    "points": 50,
    "awardedAt": "2024-12-25T14:30:00Z"
  }
}
```

---

#### Get User Points
```
GET /points/user/:userId
```

**Path Parameters**
- `userId` (required): User ID

**Response (200)**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "totalPoints": 850
}
```

---

#### Record Sale
```
POST /points/sale
```

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role**: `shopkeeper` or `admin`

**Request Body**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "stallId": "507f1f77bcf86cd799439012",
  "amount": 250.00,
  "description": "Snacks and beverages"
}
```

**Response (200)**
```json
{
  "message": "Sale recorded successfully",
  "sale": {
    "id": "507f1f77bcf86cd799439013",
    "stallId": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "amount": 250.00,
    "description": "Snacks and beverages",
    "createdAt": "2024-12-25T14:30:00Z"
  }
}
```

---

#### Get Stall Sales
```
GET /points/stall/:stallId/sales
```

**Path Parameters**
- `stallId` (required): Stall ID

**Headers**
```
Authorization: Bearer <token>
```

**Required Role**: `shopkeeper` or `admin`

**Response (200)**
```json
{
  "stallId": "507f1f77bcf86cd799439012",
  "totalSales": 5000.00,
  "transactionCount": 25
}
```

---

### Admin Endpoints

#### Toggle Phase 2
```
PUT /admin/event/:eventId/phase2
```

**Path Parameters**
- `eventId` (required): Event ID

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role**: `admin`

**Request Body**
```json
{
  "isActive": true
}
```

**Response (200)**
```json
{
  "message": "Phase 2 activated",
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Family Festival 2024",
    "isPhase2Active": true,
    "phase2StartDate": "2024-12-25T00:00:00Z"
  }
}
```

---

#### Get Event Status
```
GET /admin/event/:eventId/status
```

**Path Parameters**
- `eventId` (required): Event ID

**Headers**
```
Authorization: Bearer <token>
```

**Required Role**: `admin`

**Response (200)**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Family Festival 2024",
  "description": "Annual family gathering",
  "startDate": "2024-12-22T00:00:00Z",
  "endDate": "2024-12-25T23:59:59Z",
  "location": "Event Venue",
  "isPhase2Active": true,
  "phase2StartDate": "2024-12-25T00:00:00Z",
  "maxPoints": 1000
}
```

---

### Bulk Endpoints

#### Import Families from Excel
```
POST /bulk/import-families
```

**Headers**
```
Authorization: Bearer <token>
```

**Required Role**: `admin`

**Form Data**
- `file` (required): Excel file with columns: firstName, lastName, email, phone, familyName

**Response (200)**
```json
{
  "usersCreated": 45,
  "familiesCreated": 8,
  "errors": [
    "Failed to create user John: Duplicate email"
  ]
}
```

---

#### Get All Families
```
GET /bulk/families
```

**Headers**
```
Authorization: Bearer <token>
```

**Response (200)**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Sharma Family",
    "description": "Main family group",
    "headOfFamily": {...},
    "members": [...]
  }
]
```

---

#### Get All Users
```
GET /bulk/users
```

**Query Parameters**
- `role` (optional): Filter by role (user, shopkeeper, admin)
- `familyId` (optional): Filter by family ID

**Headers**
```
Authorization: Bearer <token>
```

**Required Role**: `admin`

**Example**
```
GET /bulk/users?role=shopkeeper&limit=100
```

**Response (200)**
```json
{
  "count": 5,
  "users": [...]
}
```

---

#### Create Stall
```
POST /bulk/stalls
```

**Headers**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Role**: `admin`

**Request Body**
```json
{
  "name": "Pizza Stall",
  "type": "food",
  "shopkeeperId": "507f1f77bcf86cd799439011",
  "pointsPerTransaction": 20
}
```

**Response (200)**
```json
{
  "message": "Stall created",
  "stall": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Pizza Stall",
    "type": "food",
    "shopkeeperId": "507f1f77bcf86cd799439011",
    "pointsPerTransaction": 20
  }
}
```

---

### Health Check

#### Get Health Status
```
GET /api/health
```

No authentication required.

**Response (200)**
```json
{
  "status": "OK",
  "timestamp": "2024-12-25T14:30:00Z"
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limits

- **General**: 100 requests per 15 minutes per IP
- **Auth**: 5 login attempts per 15 minutes per IP
- **Leaderboard**: 1000 requests per minute (cached)

---

## Data Types

### User
- `id`: String (MongoDB ObjectId)
- `firstName`: String
- `lastName`: String
- `email`: String (unique)
- `phone`: String (unique)
- `role`: Enum (user, shopkeeper, admin)
- `familyId`: ObjectId reference
- `isActive`: Boolean
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp

### Point
- `id`: String
- `userId`: ObjectId reference
- `stallId`: ObjectId reference
- `points`: Number
- `awardedBy`: ObjectId reference (shopkeeper)
- `awardedAt`: ISO 8601 timestamp
- `qrCodeData`: String (optional)

### Stall
- `id`: String
- `name`: String
- `type`: Enum (food, game, shopping, activity, other)
- `shopkeeperId`: ObjectId reference
- `pointsPerTransaction`: Number
- `isActive`: Boolean

### Family
- `id`: String
- `name`: String
- `description`: String
- `headOfFamily`: ObjectId reference
- `members`: Array of ObjectId references
- `treeStructure`: JSON object

---

## Example Workflows

### Workflow 1: User Login and View Profile

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' 

# Response: { "token": "abc123...", "user": {...} }

# 2. Get own profile
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer abc123..."

# Response: { "id": "...", "firstName": "John", ... }
```

### Workflow 2: Shopkeeper Awards Points

```bash
# 1. Login as shopkeeper
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shopkeeper@example.com","password":"pass123"}'

# 2. Award points to user after QR scan
curl -X POST http://localhost:5000/api/points/add \
  -H "Authorization: Bearer token..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "stallId": "507f1f77bcf86cd799439012",
    "points": 50
  }'

# 3. Get stall sales summary
curl http://localhost:5000/api/points/stall/507f1f77bcf86cd799439012/sales \
  -H "Authorization: Bearer token..."
```

### Workflow 3: View Leaderboard

```bash
# Get top 100 users by points
curl http://localhost:5000/api/users/leaderboard?limit=100 \
  -H "Authorization: Bearer token..."

# Response: { "totalRanked": 100, "leaderboard": [...] }
```

---

## Pagination

Endpoints that return arrays can be paginated using `skip` and `limit` (if supported):

```bash
curl "http://localhost:5000/api/users/search?q=john&limit=20&skip=0" \
  -H "Authorization: Bearer token..."
```

---

Last Updated: December 2024
