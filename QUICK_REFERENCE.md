# Quick Reference Card - Vksha API

## Getting Started (5 minutes)

### 1. Install & Run Backend
```bash
cd backend
npm install
npm run dev
```
✓ Backend runs on http://localhost:5000

### 2. Test Health
```bash
curl http://localhost:5000/api/health
```
Expected: `{"status":"OK","timestamp":"..."}`

### 3. Register Admin User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "phone": "+1234567890",
    "password": "Admin@12345",
    "role": "admin"
  }'
```
✓ Save the returned `token`

---

## Core API Endpoints

### 🔐 Authentication
```
POST   /api/auth/register      → Register user
POST   /api/auth/login         → Login user
POST   /api/auth/refresh       → Refresh token
GET    /api/auth/profile       → Get current user
```

### 👤 Users
```
GET    /api/users/profile      → Get my profile
PUT    /api/users/profile      → Update my profile
GET    /api/users/leaderboard  → View leaderboard
```

### 👨‍👩‍👧‍👦 Families
```
GET    /api/bulk/families      → List all families (admin)
POST   /api/bulk/import-families → Import from Excel (admin)
```

### ⭐ Points
```
POST   /api/points/award       → Award points (admin/shopkeeper)
GET    /api/points/history/:userId → View history
```

### 🏪 Stalls
```
POST   /api/bulk/stalls        → Create stall (admin)
GET    /api/stalls             → List stalls (admin)
```

### 📊 Admin
```
GET    /api/admin/stats        → System stats (admin)
```

---

## Example Requests

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@12345"
  }'
```

### Get Leaderboard
```bash
curl http://localhost:5000/api/users/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Award Points
```bash
curl -X POST http://localhost:5000/api/points/award \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "points": 100,
    "reason": "Purchase at stall"
  }'
```

### Import Families (Excel)
```bash
curl -X POST http://localhost:5000/api/bulk/import-families \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@families.xlsx"
```

---

## Excel Import Format

Save as `.xlsx` with columns:

| familyName | firstName | lastName | email | phone |
|-----------|-----------|----------|-------|-------|
| Johnson | John | Johnson | john@ex.com | +1234567890 |
| Johnson | Jane | Johnson | jane@ex.com | +1987654321 |
| Smith | Bob | Smith | bob@ex.com | +1555555555 |

---

## Environment Variables

**File**: `backend/.env`

```env
PORT=5000
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

---

## Common Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Everything OK |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Add/check JWT token |
| 403 | Forbidden | Use admin account |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check server logs |

---

## Postman Variables

```json
{
  "baseUrl": "http://localhost:5000/api",
  "adminToken": "your-jwt-token-here",
  "userId": "user-id-here",
  "familyId": "family-id-here"
}
```

---

## File Locations

```
backend/
  ├── src/
  │   ├── index.ts           ← Main server
  │   ├── config/
  │   │   └── storage.ts     ← Database
  │   ├── routes/
  │   │   ├── auth.ts        ← Auth endpoints
  │   │   ├── user.ts        ← User endpoints
  │   │   ├── points.ts      ← Points endpoints
  │   │   ├── admin.ts       ← Admin endpoints
  │   │   └── bulk.ts        ← Bulk operations
  │   └── middleware/
  │       └── auth.ts        ← JWT & roles
  ├── package.json
  └── tsconfig.json
```

---

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Example: `Admin@12345`

---

## User Roles

| Role | Permissions |
|------|------------|
| admin | All operations, system stats, bulk imports |
| shopkeeper | Award points, view stall stats |
| user | View own data, see leaderboard |

---

## Troubleshooting

### Backend won't start
```bash
# Check Node.js version
node --version    # Should be 18+

# Clear and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Port 5000 already in use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Invalid token
- Check token not expired
- Verify Authorization header format: `Bearer <token>`
- Regenerate token with login

### CORS errors
- Check CORS_ORIGIN in .env
- Restart server after changing .env

---

## Testing Commands

```bash
# Health check
curl http://localhost:5000/api/health

# Run tests
npm test

# Build for production
npm run build

# Check linting
npm run lint
```

---

## Database Reset

```bash
# Current system uses in-memory storage
# Data clears on server restart

# To restart:
# 1. Stop server (Ctrl+C)
# 2. Run npm run dev
# 3. All data cleared
```

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Applies To**: All endpoints
- **Headers**: Shows remaining quota

---

## Token Expiration

- **Duration**: 24 hours
- **Refresh**: POST /api/auth/refresh
- **Sign-out**: POST /api/auth/logout

---

## Support

1. Check logs: `npm run dev` output
2. Review: `API_TESTING_GUIDE.md`
3. Check: `DEPLOYMENT_GUIDE.md`
4. Reference: `QA_TESTING_CHECKLIST.md`

---

**Last Updated**: January 15, 2024
**Version**: 1.0
**Print & Keep Handy!**
