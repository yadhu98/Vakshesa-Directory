# Performance & Scaling Guide

## Architecture for 100+ Concurrent Users

### Database Optimization

1. **Index Strategy**
   ```javascript
   // Users
   db.users.createIndex({ email: 1 }, { unique: true })
   db.users.createIndex({ familyId: 1 })
   db.users.createIndex({ role: 1 })
   
   // Points (Critical for leaderboard)
   db.points.createIndex({ userId: 1 })
   db.points.createIndex({ userId: 1, stallId: 1 })
   db.points.createIndex({ awardedAt: -1 })
   
   // Families
   db.families.createIndex({ name: 1 }, { unique: true })
   db.families.createIndex({ members: 1 })
   ```

2. **Connection Pooling**
   - MongoDB default: 10 connections per app
   - With Mongoose: Automatic connection pooling
   - Free tier allows: 500 concurrent connections
   - For 100 users: Well within limits

3. **Query Optimization**
   - Use `.select()` to limit fields
   - Use `.lean()` for read-only queries
   - Implement pagination for large datasets
   - Use aggregation pipeline for complex queries

### API Response Optimization

```typescript
// Good: Lean queries for read-only operations
const users = await User.find().select('firstName lastName email').lean();

// Good: Pagination
const users = await User.find().skip(0).limit(20);

// Good: Aggregation for leaderboard
const leaderboard = await Point.aggregate([
  { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
  { $sort: { totalPoints: -1 } },
  { $limit: 100 },
]);

// Bad: Multiple database calls
for (const user of users) {
  const points = await Point.find({ userId: user._id }); // N+1 query
}
```

### Caching Strategy

**In-Memory Caching (Node-Cache)**

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL

// Cache leaderboard
const getLeaderboard = async (limit: number = 100) => {
  const cacheKey = `leaderboard_${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached) return cached;
  
  const leaderboard = await Point.aggregate([
    { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
    { $limit: limit },
  ]);
  
  cache.set(cacheKey, leaderboard);
  return leaderboard;
};
```

### Rate Limiting Configuration

```typescript
import rateLimit from 'express-rate-limit';

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts',
  skipSuccessfulRequests: true,
});

// Leaderboard can be cached heavily
const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit since response is cached
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.get('/api/users/leaderboard', leaderboardLimiter);
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load-test.yml
```

```yaml
config:
  target: "https://vksha-backend.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Spike"

scenarios:
  - name: "Get Leaderboard"
    flow:
      - get:
          url: "/api/users/leaderboard"
          headers:
            Authorization: "Bearer YOUR_TOKEN"
```

```bash
# Run test
artillery run load-test.yml
```

### Expected Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Response Time (P95) | <500ms | <200ms |
| Error Rate | <0.1% | ~0.01% |
| Concurrent Users | 100+ | 200+ |
| Throughput | 100 req/s | 300+ req/s |

### Scaling Checklist

- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Response caching implemented
- [ ] Rate limiting deployed
- [ ] Load tested with 100+ users
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Database backups automated
- [ ] Disaster recovery plan created

### Upgrade Path

**If you need more capacity:**

1. **MongoDB**
   - Current: M0 (512 MB) - $0
   - Step 1: M2 (10 GB) - $9/month
   - Step 2: M5 (50 GB) - $57/month

2. **Render**
   - Current: Free ($0/month)
   - Step 1: Starter ($7/month)
   - Step 2: Standard ($20/month)

3. **Vercel**
   - Current: Free ($0/month)
   - Already handles 100+ users fine
   - No upgrade needed for admin panel

### Database Sharding (Advanced)

If you exceed 512 MB (unlikely during event):

1. Archive old data to separate collection
2. Split families by first letter
3. Use MongoDB Atlas sharded cluster (paid)

### Memory Optimization

```typescript
// Memory-efficient pagination
export const paginatedSearch = async (page: number = 1, pageSize: number = 20) => {
  const skip = (page - 1) * pageSize;
  return User.find()
    .skip(skip)
    .limit(pageSize)
    .lean(); // Don't hydrate Mongoose objects
};
```

### Monitoring Setup

**MongoDB Atlas Alerts**
1. CPU usage > 80%
2. Connections > 400
3. Storage > 400 MB

**Render Monitoring**
1. Memory usage alerts
2. CPU usage alerts
3. Build failure notifications

**Custom Health Endpoint**

```typescript
app.get('/api/health/detailed', async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const dbConnection = await mongoose.connection.db?.admin().ping();
  
  res.json({
    status: 'OK',
    uptime,
    memory: memoryUsage,
    database: dbConnection ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});
```

## Real-world Scenario: Event Day

### Pre-Event (Dec 24)

1. Verify all indexes created
2. Run load test with 100 concurrent users
3. Check database size (should be < 100 MB)
4. Prepare backup

### Event Day (Dec 25)

1. Monitor every 15 minutes:
   - Response times
   - Error rates
   - Database connections
   - Memory usage

2. If slowdowns occur:
   ```bash
   # Clear cache
   cache.flushAll();
   
   # Check slow queries
   db.currentOp(true);
   
   # Optimize indexes if needed
   db.users.explain("executionStats").find(...);
   ```

3. Quick fixes:
   - Reduce cache TTL (temporary)
   - Increase rate limit thresholds
   - Archive very old data
   - Scale Render upward if needed

### Post-Event (Dec 26)

1. Export all data for archives
2. Generate statistics report
3. Scale back to free tier
4. Perform database cleanup

---

**Key Insight**: For a 100-person event, free tiers are completely sufficient. The main bottleneck will be the 512 MB MongoDB storage, but that's only reached if you store a lot of images or historical data. Focus on optimizing queries and caching rather than upgrading infrastructure.
