# Event Day Operations Manual

Complete checklist and procedures for running the Vksha system during the family event.

## Pre-Event Checklist (Dec 24)

### System Testing (2 hours)

- [ ] Backend API responding on all endpoints
- [ ] Admin panel loads without errors
- [ ] Mobile app installs and logs in successfully
- [ ] Database connection stable
- [ ] All indices created in MongoDB
- [ ] Load test passed with 100+ concurrent users
  ```bash
  artillery run load-test.yml
  ```

### Data Verification (1 hour)

- [ ] All family data imported into database
- [ ] All user accounts created (test login with random users)
- [ ] All stalls created with shopkeepers assigned
- [ ] Event record created with correct dates
- [ ] Leaderboard calculates correctly (manual test)
- [ ] Point allocation works (add points and verify)

### Infrastructure Ready (30 minutes)

- [ ] Backend deployment verified on Render
- [ ] Admin panel deployment verified on Vercel
- [ ] Mobile app distributed (Google Drive link ready)
- [ ] Environment variables correctly set
- [ ] Backups scheduled in MongoDB Atlas
- [ ] Monitoring alerts configured

### Team Training (1 hour)

- [ ] Admin team trained on admin panel
- [ ] Shopkeepers trained on QR scanning and point entry
- [ ] Point system rules communicated to all
- [ ] Support contact info distributed
- [ ] Emergency procedures documented

---

## Event Day Timeline

### Morning - Before Event (8:00 AM - 11:00 AM)

**8:00 AM - Pre-Event Checks**
```
- [ ] SSH into production systems
- [ ] Check backend health: curl https://vksha-backend.onrender.com/api/health
- [ ] Verify leaderboard loads
- [ ] Test login with 5 different accounts
- [ ] Check database connections (should be 0-10)
- [ ] Review error logs (should be minimal)
```

**9:00 AM - Admin Team Briefing**
```
- [ ] Review admin panel features
- [ ] Confirm everyone can log in
- [ ] Test Excel import (small batch)
- [ ] Test point allocation system
- [ ] Verify leaderboard updates in real-time
```

**10:00 AM - Shopkeeper Setup**
```
- [ ] Distribute shopkeeper credentials
- [ ] Test QR scanner on each stall
- [ ] Show how to input sales
- [ ] Show how to award points
- [ ] Confirm point-per-transaction values
```

**11:00 AM - Final Checks**
```
- [ ] Internet connectivity verified at all stalls
- [ ] Mobile app available on all staff devices
- [ ] Printer ready for temporary QR codes
- [ ] Backup power available (if needed)
- [ ] Phone numbers for support documented
```

---

### During Event (11:00 AM - 8:00 PM)

**Monitoring Schedule**

**Every 15 minutes:**
- [ ] Check backend response time
- [ ] Verify no critical errors in logs
- [ ] Monitor database connection count (should stay <50)
- [ ] Quick visual check of leaderboard

**Every 30 minutes:**
- [ ] Test user login
- [ ] Verify point allocation working
- [ ] Check stall sales numbers
- [ ] Confirm no database warnings

**Every hour:**
- [ ] Full system health check
- [ ] Database size check (should grow gradually)
- [ ] Review error logs thoroughly
- [ ] Check Render CPU/memory usage

### Real-Time Monitoring Commands

```bash
# Backend health
curl https://vksha-backend.onrender.com/api/health

# Check leaderboard (with auth token)
curl https://vksha-backend.onrender.com/api/users/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check database stats (from MongoDB Atlas)
# Go to: mongodb.com → Clusters → vksha-event → Metrics
# Look for: Connection count, network throughput, storage

# Check Render logs
# Go to: render.com → vksha-backend → Logs
# Look for: errors, 500 responses, slow queries
```

### Handling Common Issues During Event

**Issue: Slow Response Times (>500ms)**

1. First check MongoDB connections
   - If >400: Likely database overload
   - Solution: Clear cache, optimize queries, or upgrade

2. Check Render CPU/Memory
   - If near 100%: App overloaded
   - Solution: Upgrade Render plan or restart service

3. Check network
   - Ping backend: `ping vksha-backend.onrender.com`
   - If high latency: Network issue, not app

**Issue: Login Failures**

1. Check JWT_SECRET is correct
2. Verify MongoDB is accessible
3. Check rate limiting not blocking IPs
4. Restart backend if persistent

**Issue: Points Not Updating**

1. Verify shopkeeper is authenticated
2. Check database write permissions
3. Refresh leaderboard page
4. Restart if needed

**Issue: Leaderboard Not Updating**

1. Clear browser cache
2. Verify points were actually saved
3. Check MongoDB aggregation (might be slow)
4. Implement caching if very slow

---

### Escalation Procedures

**If Backend Is Unresponsive**

1. Check Render dashboard (Status page)
2. Check database connection logs
3. If needed, restart service:
   - Render dashboard → vksha-backend → Redeploy
   - (Takes ~2 minutes)

**If Database Is Slow**

1. Check for slow queries in MongoDB
2. Reduce cache TTL temporarily
3. Archive old data if size issue
4. Upgrade to M2 tier if needed ($$)

**If Too Many Errors**

1. Check error logs for pattern
2. Identify affected endpoint
3. Restart that specific service
4. Escalate to development team

---

## Post-Event (8:00 PM - 9:00 PM)

### Final Data Capture

```javascript
// Export leaderboard
db.points.aggregate([
  { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
  { $sort: { totalPoints: -1 } }
]).toArray()

// Export top 100
db.sales.find({}).limit(100)

// Get statistics
db.events.findOne({ name: "Family Festival 2024" })
```

- [ ] Export final leaderboard
- [ ] Export all transactions
- [ ] Export event statistics
- [ ] Take screenshots of final stats
- [ ] Generate winner announcements

### Data Cleanup

- [ ] Archive all transaction records
- [ ] Create backup of entire database
- [ ] Document final metrics
- [ ] Save logs for audit

### Team Debrief

- [ ] Collect feedback from shopkeepers
- [ ] Document any issues encountered
- [ ] Identify improvements for next year
- [ ] Thank everyone for participation

---

## Monitoring Dashboard Setup

### Create Real-Time Dashboard

**Option 1: Simple Script**
```bash
#!/bin/bash
while true; do
  clear
  echo "=== Vksha Event Monitoring ==="
  echo "Time: $(date)"
  echo ""
  echo "Backend Health:"
  curl -s https://vksha-backend.onrender.com/api/health | jq .
  echo ""
  echo "Leaderboard Count:"
  # Requires auth token
  curl -s https://vksha-backend.onrender.com/api/users/leaderboard?limit=1 | jq '.totalRanked'
  sleep 30
done
```

**Option 2: Use Uptime Monitoring**
- Sign up at [uptime.com](https://www.uptime.com)
- Add endpoint: `https://vksha-backend.onrender.com/api/health`
- Set alert on failure

### Manual Monitoring Checklist

Print this and keep it in front of the monitoring person:

```
Time  | Status | Response Time | DB Conn | Error Count | Notes
------|--------|---------------|---------|-------------|-------
12:00 |   ✓    |     150ms     |   15    |      0      |  OK
12:15 |   ✓    |     200ms     |   20    |      0      |  OK
12:30 |   ✓    |     180ms     |   18    |      0      |  OK
```

---

## Emergency Procedures

### Complete System Failure

1. **Notify admin team**
   - "System is down, stand by"
   - Do NOT tell attendees yet

2. **Check all systems**
   - Backend: https://vksha-backend.onrender.com/api/health
   - Admin: https://admin-url.vercel.app
   - Database: MongoDB Atlas dashboard

3. **Restart procedures**
   - Render: Redeploy button (2 min)
   - Vercel: Redeploy (1 min)
   - MongoDB: Usually fine (5 min to reconnect)

4. **If multiple restarts fail**
   - Fall back to manual point entry
   - Use paper leaderboard
   - Sync to system later

### Data Loss Scenario

1. **Immediate action**
   - Stop accepting new points
   - Verify last backup timestamp
   - Estimate how much data lost

2. **Recovery**
   - Restore from MongoDB backup
   - Accept some data loss (last few minutes)
   - Verify integrity with sample checks
   - Resume operations

3. **Prevention**
   - Automated hourly backups enabled
   - Point-in-time recovery available
   - Test restores quarterly

---

## Performance Optimization During Event

### If You Need to Optimize:

**Low Hanging Fruit (< 5 minutes)**
```javascript
// Clear cache
db.points.deleteMany({ awardedAt: { $lt: new Date(new Date().getTime() - 60000) } })

// Add missing index
db.points.createIndex({ userId: 1 })
```

**Medium Effort (15 minutes)**
```javascript
// Archive old data
db.archive.insertMany(db.points.find({ awardedAt: { $lt: new Date(new Date().getTime() - 3600000) } }).toArray())
db.points.deleteMany({ awardedAt: { $lt: new Date(new Date().getTime() - 3600000) } })
```

**Large Changes (30 minutes)**
- Upgrade MongoDB to M2
- Upgrade Render to Starter plan
- Both cost money, last resort only

---

## Communication During Event

### Slack/WhatsApp Status Channel

```
12:00 - System Live! Event started ✓
12:30 - All systems nominal, 150 users connected
13:00 - Leaderboard active, 450 points awarded
14:30 - Peak load, 180 concurrent users
18:00 - Winding down, final push for points
19:00 - Event concludes, final leaderboard locked
```

### If There's an Issue

Inform relevant people:
- **Admin Team**: "Search feature temporarily slow"
- **Shopkeepers**: "Can't log in? Retry in 30 sec"
- **Everyone**: "System will be down for 2 minutes"

Never blame the system - always have a workaround ready.

---

## Success Metrics

By end of day, you should have:

- ✓ 100+ users successfully registered
- ✓ 500+ points awarded (minimum)
- ✓ <1% error rate on API calls
- ✓ <500ms average response time
- ✓ 0 data loss incidents
- ✓ All shopkeepers completed transactions
- ✓ Leaderboard stable and accurate
- ✓ Team reports positive experience

---

## Lessons Learned Documentation

After event, document:

1. **What Went Well**
   - System stability?
   - User experience?
   - Team coordination?

2. **What Could Be Better**
   - Slow endpoints?
   - Confusing UI?
   - Training gaps?

3. **For Next Year**
   - Infrastructure upgrades needed?
   - Feature requests?
   - Process improvements?

---

## Quick Reference Cards

Print and distribute:

### For Shopkeepers

```
╔════════════════════════════════╗
║   POINT ENTRY QUICK GUIDE      ║
╠════════════════════════════════╣
║ 1. Open Vksha app              ║
║ 2. Tap "Add Points"            ║
║ 3. Scan customer QR code       ║
║ 4. Enter points: [50]          ║
║ 5. Tap CONFIRM                 ║
║ 6. Receipt printed             ║
║                                ║
║ Support: +91-XXXX-XXXX-XXXX   ║
╚════════════════════════════════╝
```

### For Admins

```
╔════════════════════════════════╗
║  ADMIN PANEL QUICK REFERENCE   ║
╠════════════════════════════════╣
║ Dashboard: System overview     ║
║ Leaderboard: Live rankings     ║
║ Event Settings: Phase control  ║
║ Help: Documentation in system  ║
║                                ║
║ Emergency: Restart from menu   ║
╚════════════════════════════════╝
```

---

**Final Note**: Stay calm, keep communication open, and remember - the system is built to handle this. Most issues are user error, not system failure!

Good luck! 🎉
