# Deployment Guide - Vksha Family Event Management System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Migration](#database-migration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling Configuration](#scaling-configuration)
8. [Rollback Procedures](#rollback-procedures)
9. [Security Configuration](#security-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No ESLint warnings: `npm run lint`
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No console.log statements in production code
- [ ] All environment variables documented
- [ ] Dependencies are up-to-date

### Security Review
- [ ] Sensitive data not committed to repository
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] CORS origins are whitelisted
- [ ] Rate limiting is configured
- [ ] Input validation is comprehensive
- [ ] Password hashing is implemented (bcrypt)
- [ ] No hardcoded API keys

### Documentation
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Database schema documented
- [ ] Deployment steps documented
- [ ] Rollback procedures documented
- [ ] Architecture decisions documented

### Testing
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Load testing performed
- [ ] Security testing completed

---

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm 9+
- MongoDB (optional, currently using in-memory storage)

### Installation Steps

```bash
# Clone repository
git clone <repository-url>
cd Vksha

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../admin
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Return to root
cd ..
```

### Configure Environment Variables

**Backend (.env in backend/ directory):**
```env
# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRY=24h

# Database (for future MongoDB integration)
MONGODB_URI=mongodb://localhost:27017/vksha
DB_NAME=vksha

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

**Frontend (.env in admin/ directory):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Vksha Admin
VITE_APP_VERSION=1.0.0
```

**Mobile (.env in mobile/ directory):**
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Start Development Environment

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Admin Frontend
cd admin
npm run dev

# Terminal 3: Mobile (Expo)
cd mobile
npm start
```

### Verify Setup

```bash
# Health check
curl http://localhost:5000/api/health

# Admin Frontend
Open http://localhost:5173

# Mobile
Scan QR code in terminal with Expo Go app
```

---

## Staging Deployment

### Infrastructure Requirements

**Server Specifications:**
- OS: Ubuntu 20.04 LTS
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Storage: 20GB SSD
- Network: 1 Mbps minimum bandwidth

### Deployment Steps

#### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/vksha
cd /var/www/vksha
```

#### 2. Clone and Setup Application

```bash
# Clone repository
git clone <repository-url> .

# Install dependencies
cd backend && npm install --production

# Build application
npm run build

# Return to root
cd ..
```

#### 3. Configure Environment

```bash
# Create .env file
cd backend
cat > .env << EOF
PORT=5000
NODE_ENV=staging
JWT_SECRET=staging-secret-key-min-32-characters-long
JWT_EXPIRY=24h
MONGODB_URI=mongodb://localhost:27017/vksha-staging
CORS_ORIGIN=https://staging-admin.yourdomain.com,https://staging.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
EOF
```

#### 4. Setup PM2

```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'vksha-api',
      script: './dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging'
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
```

#### 5. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo cat > /etc/nginx/sites-available/vksha-api << 'EOF'
upstream vksha_api {
  server localhost:5000;
  server localhost:5001;
}

server {
    listen 80;
    server_name staging-api.yourdomain.com;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://vksha_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/vksha-api /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d staging-api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### 7. Deploy Frontend

```bash
# Build admin frontend
cd admin
npm run build

# Deploy to CDN or static server
# Copy dist/ folder to web server

# Build mobile
cd ../mobile
npm run build

# Deploy via Expo or Apple/Google stores
```

---

## Production Deployment

### Production Infrastructure

**Recommended Setup:**
- Load Balancer (AWS ALB, Nginx)
- Multiple API Server Instances
- MongoDB Cluster
- Redis Cache Layer
- S3 for file storage
- CloudFront/CDN for static files
- RDS for database backups

### Production .env Configuration

```env
# Server
PORT=5000
NODE_ENV=production
INSTANCE_ID=api-prod-1

# Security
JWT_SECRET=production-secret-key-min-32-characters-random
JWT_EXPIRY=12h

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vksha
DB_REPLICA_SET=true
DB_NAME=vksha

# CORS
CORS_ORIGIN=https://app.yourdomain.com,https://admin.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Storage
FILE_STORAGE_TYPE=s3
S3_BUCKET=vksha-prod
S3_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
LOG_FILE=/var/log/vksha/app.log

# Email (for notifications)
SMTP_HOST=smtp.youremail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password
```

### Production Deployment Steps

1. **Pre-deployment**
   ```bash
   # Run full test suite
   npm test -- --coverage
   
   # Build application
   npm run build
   
   # Create database backups
   mongodump --uri "mongodb://..." --out ./backups/pre-deploy
   ```

2. **Rolling Deployment**
   ```bash
   # Update first instance
   pm2 reload vksha-api --update-env
   
   # Wait for health checks to pass
   # Update next instance
   ```

3. **Post-deployment Validation**
   ```bash
   # Run smoke tests
   npm run test:smoke
   
   # Check error rates
   # Monitor performance metrics
   # Verify all endpoints responding
   ```

---

## Database Migration

### Current Setup: In-Memory Storage

The system currently uses in-memory storage for development/staging.

### Migration to MongoDB

```typescript
// Update storage.ts to use MongoDB
import mongoose from 'mongoose';

export async function initializeDatabase() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');
}

// Replace InMemoryStorage with MongoDB models
```

### Data Migration Script

```bash
# Export from in-memory
npm run script:export-data

# Import to MongoDB
npm run script:import-data --source=./data-export.json --target=mongodb
```

---

## Monitoring & Logging

### Application Logging

```bash
# View logs
pm2 logs vksha-api

# Clear logs
pm2 flush

# Log levels: debug, info, warn, error
```

### Performance Monitoring

```bash
# Install monitoring tools
npm install prometheus-client

# Setup Grafana dashboard
# Add Prometheus data source
```

### Error Tracking

```bash
# Install Sentry
npm install @sentry/node

# Configure in index.ts
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Key Metrics to Monitor

- API Response Time
- Request Count
- Error Rate
- CPU Usage
- Memory Usage
- Database Query Performance
- Concurrent Users

---

## Scaling Configuration

### Horizontal Scaling

```bash
# PM2 Cluster Mode
pm2 start app.js -i max

# Auto-restart on crash
pm2 start app.js --restart-delay=4000
```

### Vertical Scaling

```bash
# Increase Node.js memory
node --max-old-space-size=4096 app.js
```

### Database Scaling

```javascript
// Create indexes for frequently queried fields
db.collection('users').createIndex({ email: 1 });
db.collection('families').createIndex({ name: 1 });
db.collection('points').createIndex({ userId: 1, createdAt: -1 });
```

### Cache Layer (Redis)

```bash
# Install Redis
sudo apt install redis-server

# Configure in backend
npm install redis

// In code
const redis = require('redis');
const client = redis.createClient({ host: 'localhost', port: 6379 });
```

---

## Rollback Procedures

### Quick Rollback (Last 5 minutes)

```bash
# Kill current process
pm2 kill

# Revert code to previous commit
git revert HEAD

# Rebuild and restart
npm run build
pm2 start ecosystem.config.js

# Verify rollback
curl http://localhost:5000/api/health
```

### Full Rollback (Last deployment)

```bash
# Stop current version
pm2 stop vksha-api

# Restore from backup
mongorestore --uri "mongodb://..." --drop ./backups/pre-deploy/vksha

# Checkout previous version
git checkout previous-release-tag

# Rebuild
npm install
npm run build

# Restart
pm2 start ecosystem.config.js
```

### Partial Rollback (Specific Data)

```bash
# Restore specific collections
mongorestore --uri "mongodb://..." --drop ./backups/pre-deploy/vksha/users.bson
```

---

## Security Configuration

### Environment Variables
- Never commit .env to git
- Use .env.example for template
- Rotate JWT_SECRET quarterly
- Use strong passwords (32+ characters)

### Database Security
- Enable authentication
- Use SSL/TLS for connections
- Restrict network access
- Enable encryption at rest

### API Security
- Enable HTTPS/TLS
- Implement rate limiting
- Validate all inputs
- Sanitize outputs
- Use security headers (Helmet)

### Secrets Management
```bash
# Use AWS Secrets Manager or HashiCorp Vault
# Rotate secrets regularly
# Audit secret access
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Memory Leak
```bash
# Monitor memory
pm2 monit

# Analyze heap dump
pm2 dump
```

### Database Connection Issues
```bash
# Test connection
mongosh mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Check connection pool
```

### High Response Time
```bash
# Enable profiling
mongo > db.setProfilingLevel(1, 100)

# Analyze slow queries
mongo > db.system.profile.find().limit(5).sort({ts:-1}).pretty()
```

### SSL/TLS Issues
```bash
# Verify certificate
openssl s_client -connect yourdomain.com:443

# Check expiration
certbot certificates
```

---

## Backup & Recovery

### Automated Backups

```bash
# Daily MongoDB backups
0 2 * * * mongodump --uri "mongodb://..." --out /var/backups/vksha-$(date +\%Y\%m\%d)
```

### Backup Verification

```bash
# Test restore
mongorestore --uri "mongodb://localhost:27017/vksha-test" /var/backups/vksha-latest
```

### Disaster Recovery Plan

1. **RPO** (Recovery Point Objective): 24 hours
2. **RTO** (Recovery Time Objective): 4 hours
3. **Backup Location**: Off-site cloud storage
4. **Backup Frequency**: Daily with point-in-time recovery

---

## Release Notes

### Versioning
- Use Semantic Versioning (X.Y.Z)
- v1.0.0 = Initial release
- v1.1.0 = New features
- v1.0.1 = Bug fixes

### Release Process
1. Create release branch
2. Update version in package.json
3. Run full test suite
4. Create release notes
5. Merge to main
6. Tag release
7. Deploy to production

---

## Support & Documentation

- API Documentation: `/documentation`
- Architecture Guide: `ARCHITECTURE.md`
- Scaling Guide: `SCALING.md`
- Event Day Manual: `EVENT_DAY_MANUAL.md`

---

**Last Updated:** January 15, 2024
**Version:** 1.0
