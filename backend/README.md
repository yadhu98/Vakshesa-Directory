# Vksha Event Management System - Backend

Modern Express.js TypeScript backend for a family event management system with support for family directory, tree visualization, point tracking, and leaderboard functionality.

## Features

### Phase 1: Family Directory
- User registration and profile management
- Family node tree visualization
- User search functionality
- Profile details visible in search

### Phase 2: Point Tracking & Leaderboard
- QR code scanning for point allocation
- Real-time leaderboard tracking
- Shopkeeper sales management
- Admin dashboard for system control

## Architecture

```
backend/
├── src/
│   ├── config/          # Database and config
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Route handlers
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & error handling
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── index.ts         # Main server file
├── dist/                # Compiled JavaScript
└── package.json
```

## Prerequisites

- Node.js 16+
- MongoDB (Atlas or local)
- npm or yarn

## Installation

1. Clone the repository
2. Navigate to backend directory: `cd backend`
3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with your configuration:
   - Add MongoDB URI
   - Set JWT_SECRET
   - Configure CORS_ORIGIN

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Watch Mode
```bash
npm run watch
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/family/:familyId/tree` - Get family tree
- `GET /api/users/search?q=<query>` - Search users
- `GET /api/users/leaderboard` - Get leaderboard

### Points (Phase 2)
- `POST /api/points/add` - Add points to user
- `GET /api/points/user/:userId` - Get user total points
- `POST /api/points/sale` - Record sale
- `GET /api/points/stall/:stallId/sales` - Get stall sales summary

### Admin
- `PUT /api/admin/event/:eventId/phase2` - Toggle phase 2
- `GET /api/admin/event/:eventId/status` - Get event status

## Database Models

### User
- firstName, lastName, email, phone
- password (hashed), role (user/shopkeeper/admin)
- familyId, profilePicture, dateOfBirth, gender
- timestamps

### Family
- name, description
- headOfFamily, members array
- treeStructure (JSON)
- timestamps

### FamilyNode
- userId, familyId, parentId
- generation, relationshipType
- timestamps

### Event
- name, description
- startDate, endDate, location
- isPhase2Active, phase2StartDate, maxPoints
- timestamps

### Stall
- name, description, type (food/game/shopping/activity/other)
- shopkeeperId, pointsPerTransaction
- timestamps

### Point
- userId, stallId, points
- transactionId, qrCodeData
- awardedBy, awardedAt
- timestamps

### Sale
- stallId, userId, amount, description
- timestamps

## Performance Optimizations

- Database indexing on frequently queried fields
- Rate limiting (100 requests/15 minutes)
- JWT authentication for security
- Input validation and sanitization
- Helmet for HTTP security headers
- CORS configuration

## Environment Variables

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "stack": "Error trace (development only)"
}
```

## Security

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## Scaling for 100+ Users

The backend is designed to handle 100+ concurrent users:

- Database indexing for fast queries
- Aggregation pipeline for leaderboard
- Connection pooling via Mongoose
- Rate limiting to prevent abuse
- Stateless architecture for horizontal scaling

## Deployment

See deployment guide in root README for:
- Render.com (free tier) deployment
- Environment configuration
- Database setup
- CI/CD pipeline

## License

ISC
