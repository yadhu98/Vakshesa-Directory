# Vksha - Family Event Management System

A comprehensive platform for managing family cultural and sports events with 100+ concurrent users. Built with Express.js backend, React admin panel, and React Native mobile app.

## Project Structure

```
Vksha/
├── backend/        # Express.js TypeScript API server
├── admin/          # React.js admin dashboard
├── mobile/         # React Native mobile app
└── README.md       # This file
```

## Features

### Phase 1: Family Directory
- ✅ User profiles and registration
- ✅ Family tree visualization with node hierarchy
- ✅ Advanced search functionality
- ✅ Family member management

### Phase 2: Point Tracking & Leaderboard (Dec 25 onwards)
- ✅ QR code scanning system
- ✅ Point allocation per stall
- ✅ Real-time leaderboard
- ✅ Shopkeeper dashboard
- ✅ Sales tracking

## Tech Stack

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting

### Admin Panel
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **HTTP Client**: Axios

### Mobile App
- **Framework**: React Native
- **Platform**: Expo
- **Navigation**: React Navigation
- **HTTP Client**: Axios
- **Camera**: expo-camera (for QR scanning)

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB account (Atlas recommended)
- Expo CLI: `npm install -g expo-cli`

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Admin Panel Setup

```bash
cd admin
npm install
cp .env.example .env
# VITE_API_URL should point to your backend
npm run dev
```

Admin panel runs on `http://localhost:3001`

### 3. Mobile App Setup

```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_URL should point to your backend
npm start
# Scan QR code with Expo Go app
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Users & Families
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/family/:familyId/tree` - Get family tree
- `GET /api/users/search?q=<query>` - Search users
- `GET /api/users/leaderboard` - Get leaderboard

### Points & Sales (Phase 2)
- `POST /api/points/add` - Award points
- `GET /api/points/user/:userId` - Get user points
- `POST /api/points/sale` - Record sale
- `GET /api/points/stall/:stallId/sales` - Get stall sales

### Admin
- `PUT /api/admin/event/:eventId/phase2` - Toggle Phase 2
- `GET /api/admin/event/:eventId/status` - Get event status

## Database Models

### Core Models
- **User**: Profile, authentication, role management
- **Family**: Family groups and hierarchy
- **FamilyNode**: Tree structure relationships
- **Event**: Event management and phase control

### Phase 2 Models
- **Stall**: Vendor management
- **Point**: Point allocation records
- **Sale**: Transaction records

## Deployment

### Backend Deployment (Render.com - Free)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Create new Web Service
   - Connect GitHub repository
   - Set environment variables:
     ```
     NODE_ENV=production
     MONGODB_URI=your_mongodb_atlas_uri
     JWT_SECRET=your_secure_secret
     CORS_ORIGIN=your_admin_url,your_mobile_api_url
     ```
   - Deploy

3. **Database Setup**
   - Use MongoDB Atlas free tier
   - Create cluster in same region as backend
   - Get connection string and add to Render env

### Admin Panel Deployment (Vercel - Free)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Admin**
   - Import project from GitHub
   - Set environment variable:
     ```
     VITE_API_URL=your_render_backend_url/api
     ```
   - Deploy

3. **Custom Domain (Optional)**
   - Add domain in Vercel project settings

### Mobile App Distribution

1. **Build for iOS**
   ```bash
   cd mobile
   npm run build-ios
   ```
   - Download from EAS builds
   - Create Google Drive share link

2. **Build for Android**
   ```bash
   cd mobile
   npm run build-android
   ```
   - Download APK from EAS builds
   - Host on Google Drive

3. **Distribution**
   - Create Google Drive folder
   - Share link with family members
   - For iOS: Use iOS app distribution
   - For Android: Direct APK download

## Performance Optimization

### Backend
- Database indexing on frequently queried fields
- Rate limiting (100 requests/15 minutes)
- Aggregation pipeline for leaderboard calculations
- Connection pooling via Mongoose
- Stateless architecture for horizontal scaling

### Frontend
- Code splitting with Vite
- Lazy loading of routes
- Image optimization
- Caching strategies

### Handling 100+ Concurrent Users
- MongoDB can handle 100+ concurrent connections on free tier
- Render free tier has sufficient resources
- Rate limiting prevents abuse
- Stateless API scales horizontally
- Use CDN for static assets in production

## Development Workflow

### Running All Services

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Admin Panel
cd admin && npm run dev

# Terminal 3: Mobile App
cd mobile && npm start
```

### Default Credentials
- **Admin Email**: admin@vksha.com
- **Admin Password**: change_me (⚠️ Change in production)

## Database Schema & Relationships

```
User
├── familyId → Family
├── role: admin|shopkeeper|user
└── password: hashed

Family
├── members: [User]
├── headOfFamily: User
└── treeStructure: JSON

FamilyNode
├── userId → User
├── familyId → Family
├── parentId → User
└── generation: number

Stall
├── shopkeeperId → User
└── type: food|game|shopping|activity|other

Point
├── userId → User
├── stallId → Stall
├── awardedBy → User (Shopkeeper)
└── awardedAt: timestamp

Sale
├── stallId → Stall
├── userId → User
└── amount: number
```

## Monitoring & Maintenance

### Health Check
- Backend: `GET /api/health` returns `{ status: 'OK' }`
- Admin: Check page loads without errors
- Mobile: Test login and API calls

### Logs
- **Render**: View logs in Render dashboard
- **Vercel**: View logs in Vercel dashboard
- **Backend**: Check console logs during development

### Scaling During Event

1. **Monitor Performance**
   - Check Render dashboard metrics
   - Monitor MongoDB Atlas connection count
   - Review API response times

2. **If Slowdowns Occur**
   - Temporarily upgrade Render plan
   - Increase MongoDB connections
   - Implement caching for leaderboard

3. **Post-Event**
   - Scale back to free tier
   - Archive event data
   - Prepare for next year

## Security Checklist

- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Configure CORS properly
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB IP whitelist
- [ ] Regular backups of MongoDB data
- [ ] Monitor for suspicious activity

## Troubleshooting

### Backend Won't Connect to Database
- Verify MongoDB URI in .env
- Check network access in MongoDB Atlas
- Ensure database name matches

### Admin Can't Connect to Backend
- Verify VITE_API_URL in .env
- Check CORS settings on backend
- Verify backend is running

### Mobile App Won't Connect
- Check EXPO_PUBLIC_API_URL
- Verify phone can reach backend URL
- Try connecting to localhost vs production

### Performance Issues During Event
- Check MongoDB connection count
- Review slow query logs
- Consider upgrading Render plan temporarily
- Implement aggressive caching

## Support & Maintenance

### Regular Tasks
- [ ] Weekly: Monitor error logs
- [ ] Weekly: Check database size
- [ ] Monthly: Review user activity
- [ ] Monthly: Update dependencies
- [ ] Before event: Full system test

### Backup Strategy
- Automated backups via MongoDB Atlas
- Manual export of critical data
- Test restore procedures

## Future Enhancements

- [ ] Image upload for profiles
- [ ] Excel import for bulk user creation
- [ ] SMS notifications
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Photo gallery for event
- [ ] Social sharing features
- [ ] Payment integration

## License

ISC

## Contributing

1. Create feature branch
2. Make changes
3. Submit pull request
4. Code review and merge

## Contact

For issues or questions, contact the development team.

---

**Last Updated**: December 2024
**Version**: 1.0.0
