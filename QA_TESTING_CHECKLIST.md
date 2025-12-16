# QA Testing Checklist - Vksha Family Event Management System

## Test Overview

This comprehensive checklist covers all aspects of testing for the Vksha Family Event Management System including:
- Functional Testing
- Integration Testing
- Performance Testing
- Security Testing
- Usability Testing
- Accessibility Testing
- Compatibility Testing

---

## 1. Functional Testing - Authentication & Authorization

### 1.1 User Registration
- [ ] New user can register with valid email
- [ ] New user can register with valid phone
- [ ] Password must be at least 8 characters
- [ ] Password must contain uppercase letter
- [ ] Password must contain number
- [ ] Error when email already exists
- [ ] Error when phone already exists
- [ ] Default role is "user" when not specified
- [ ] Admin users can only be created by admins
- [ ] Welcome email sent after registration
- [ ] User cannot register with SQL injection payload
- [ ] User cannot register with XSS payload

### 1.2 User Login
- [ ] User can login with correct email and password
- [ ] User can login with correct phone and password (if supported)
- [ ] JWT token returned on successful login
- [ ] JWT token is valid and not expired
- [ ] Error when email doesn't exist (don't reveal user existence)
- [ ] Error when password incorrect
- [ ] Error when account locked after 5 failed attempts
- [ ] Account unlocks after 15 minutes
- [ ] Login attempt logged in audit trail
- [ ] Last login timestamp updated

### 1.3 Token Management
- [ ] Token expires after 24 hours
- [ ] Token can be refreshed before expiration
- [ ] Token refresh creates new valid token
- [ ] Logout invalidates token
- [ ] Expired token returns 401 error
- [ ] Invalid token signature returns 401 error
- [ ] Missing token returns 401 error

### 1.4 Authorization
- [ ] Regular user cannot access admin endpoints
- [ ] Regular user cannot access shopkeeper endpoints
- [ ] Admin can access all endpoints
- [ ] Shopkeeper can only access own stall data
- [ ] User can only access own profile
- [ ] User can only view family data they belong to

---

## 2. Functional Testing - User Management

### 2.1 User Profile
- [ ] User can view own profile
- [ ] User can update first name
- [ ] User can update last name
- [ ] User can update email
- [ ] User can update phone
- [ ] Email uniqueness validated on update
- [ ] Phone uniqueness validated on update
- [ ] User cannot update other user's profile
- [ ] Admin can update any user profile
- [ ] Profile photo can be uploaded
- [ ] Profile photo size limit enforced (max 5MB)
- [ ] Only image formats accepted

### 2.2 User Search
- [ ] Admin can search users by email
- [ ] Admin can search users by name
- [ ] Admin can filter users by role
- [ ] Admin can filter users by family
- [ ] Search results pagination works
- [ ] Search is case-insensitive
- [ ] Search results exclude password field

### 2.3 User Leaderboard
- [ ] Leaderboard sorted by total points (descending)
- [ ] User rank calculated correctly
- [ ] Pagination works (default 100 per page)
- [ ] User's own rank highlighted
- [ ] Top 10 highlighted/emphasized
- [ ] Monthly leaderboard shows current month only
- [ ] Yearly leaderboard shows current year only
- [ ] Export leaderboard as CSV works

---

## 3. Functional Testing - Family Management

### 3.1 Family Creation
- [ ] Admin can create family with name
- [ ] Admin can add description
- [ ] Family name must be unique
- [ ] Family requires at least one member
- [ ] Family ID generated automatically
- [ ] Creation timestamp recorded
- [ ] Family creator recorded

### 3.2 Family Import (Excel)
- [ ] Valid Excel file imports successfully
- [ ] Users grouped by family name correctly
- [ ] Families created for each unique family name
- [ ] Default password assigned to imported users
- [ ] FamilyNode created for each user
- [ ] Duplicate email detected and rejected
- [ ] Duplicate phone detected and rejected
- [ ] Invalid Excel format rejected with error
- [ ] Large files (1000+ rows) handled correctly
- [ ] Import process is atomic (all or nothing)
- [ ] Partial failure returns detailed error list
- [ ] Import progress shown to user
- [ ] Admin-only access enforced

### 3.3 Family Hierarchy
- [ ] Family structure maintained correctly
- [ ] Parent-child relationships valid
- [ ] Circular references prevented
- [ ] Generation levels calculated correctly
- [ ] Can navigate up family tree
- [ ] Can navigate down family tree

### 3.4 Family Management
- [ ] Admin can view all families
- [ ] User can view own family
- [ ] Family members list accurate
- [ ] Can add members to existing family
- [ ] Can remove members from family
- [ ] Family deleted when all members removed
- [ ] Family data not lost on member removal

---

## 4. Functional Testing - Points System

### 4.1 Points Award
- [ ] Admin can award points
- [ ] Shopkeeper can award points at own stall
- [ ] Points amount must be positive
- [ ] Points must be integer
- [ ] Reason/note can be added
- [ ] Transaction record created
- [ ] User's total points updated
- [ ] Error if user doesn't exist
- [ ] Error if points exceeds max limit (if any)

### 4.2 Points History
- [ ] User can view own points history
- [ ] Admin can view any user's history
- [ ] Transactions sorted by date (newest first)
- [ ] Total points calculated correctly
- [ ] Filter by date range works
- [ ] Filter by transaction type works
- [ ] Export history as CSV works
- [ ] Pagination works on history

### 4.3 Points Redemption
- [ ] User can redeem points for rewards
- [ ] Sufficient points check enforced
- [ ] Redemption creates deduction transaction
- [ ] User's total points reduced correctly
- [ ] Redemption history tracked
- [ ] Cannot redeem more than available

### 4.4 Points Correction
- [ ] Admin can adjust points
- [ ] Adjustment reason recorded
- [ ] Audit log shows original and new values
- [ ] Email notification sent to user
- [ ] Cannot adjust negative balance (if applicable)

---

## 5. Functional Testing - Stall Management

### 5.1 Stall Creation
- [ ] Admin can create stall
- [ ] Stall name required
- [ ] Stall type required
- [ ] Stall type from predefined list
- [ ] Shopkeeper assigned to stall
- [ ] Points per transaction default is 10
- [ ] Points per transaction customizable
- [ ] Stall ID generated automatically
- [ ] Multiple stalls can share shopkeeper

### 5.2 Stall Operations
- [ ] Stall status can be active/inactive
- [ ] Inactive stalls don't award points
- [ ] Stall inventory tracked
- [ ] Stock levels can be updated
- [ ] Low stock alerts triggered
- [ ] Stall hours configured
- [ ] Stall location stored

### 5.3 Stall Analytics
- [ ] Total transactions tracked
- [ ] Total points awarded tracked
- [ ] Average points per transaction calculated
- [ ] Peak hours identified
- [ ] Busiest days identified
- [ ] Revenue/value calculated

---

## 6. Integration Testing

### 6.1 Cross-Feature Integration
- [ ] User registration → Family assignment → Points award workflow
- [ ] Excel import → User creation → Family creation → Points initialization
- [ ] User login → Profile access → Leaderboard view → Points history
- [ ] Points award → Transaction record → Leaderboard update

### 6.2 Data Consistency
- [ ] User delete cascades to points
- [ ] User delete cascades to family data
- [ ] Family delete removes all members
- [ ] Transaction deletion updates totals
- [ ] Concurrent requests don't corrupt data
- [ ] Database transactions atomic

### 6.3 API Integration
- [ ] Frontend calls correct endpoints
- [ ] Mobile calls correct endpoints
- [ ] Admin calls correct endpoints
- [ ] Request/response formats match specs
- [ ] All endpoints return proper status codes
- [ ] Pagination works across all list endpoints

---

## 7. Performance Testing

### 7.1 Response Time
- [ ] Authentication endpoint < 100ms
- [ ] User lookup < 50ms
- [ ] Leaderboard calculation < 500ms (for 1000 users)
- [ ] Points award < 200ms
- [ ] Excel import < 5 seconds (for 1000 rows)
- [ ] File upload < 2 seconds (for 10MB file)

### 7.2 Concurrent Users
- [ ] 100 concurrent logins handled
- [ ] 500 concurrent API requests handled
- [ ] No requests drop with 1000 concurrent users
- [ ] Database queries don't timeout
- [ ] Memory usage stays under 500MB

### 7.3 Load Testing
- [ ] System stable under normal load
- [ ] Graceful degradation under peak load
- [ ] No data loss during load spikes
- [ ] Rate limiting triggers correctly

### 7.4 Database Performance
- [ ] Query response time < 100ms
- [ ] Index creation complete in < 1 minute
- [ ] Bulk insert 1000 records in < 10 seconds
- [ ] No N+1 query problems

---

## 8. Security Testing

### 8.1 Authentication Security
- [ ] Passwords hashed with bcrypt
- [ ] Passwords not stored in plaintext
- [ ] Salt rounds >= 10
- [ ] Password history maintained (cannot reuse)
- [ ] Password expiration enforced (if required)
- [ ] Weak password patterns rejected
- [ ] Brute force attempts blocked
- [ ] Account lockout after failed attempts

### 8.2 Authorization Security
- [ ] Role-based access control enforced
- [ ] Privilege escalation prevented
- [ ] User cannot access other user's data
- [ ] Admin endpoints protected
- [ ] Endpoint authorization checks present

### 8.3 Data Protection
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Sensitive data encrypted at rest
- [ ] Passwords never logged
- [ ] API keys not hardcoded
- [ ] Secrets stored in environment variables
- [ ] Database backups encrypted

### 8.4 Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CSRF tokens validated
- [ ] Email validation proper format
- [ ] Phone number validation
- [ ] File upload type validation
- [ ] File size limits enforced
- [ ] Special characters escaped

### 8.5 API Security
- [ ] CORS properly configured
- [ ] Rate limiting enforced
- [ ] API keys rotated regularly
- [ ] Sensitive endpoints behind auth
- [ ] Error messages don't leak info
- [ ] Security headers present (Helmet)
- [ ] HTTPS enforced in production

### 8.6 Session Security
- [ ] Session timeout after inactivity
- [ ] Session tokens secure (HttpOnly, Secure flags)
- [ ] Token refresh mechanism present
- [ ] Token invalidation on logout
- [ ] CSRF tokens prevent form hijacking

### 8.7 Data Privacy
- [ ] Personal data not logged unnecessarily
- [ ] Data retention policy enforced
- [ ] GDPR compliance (if applicable)
- [ ] Export data in standard format available
- [ ] Data deletion available
- [ ] Audit logs maintained

---

## 9. Usability Testing

### 9.1 Frontend (Admin)
- [ ] Navigation intuitive
- [ ] Forms are clear and labeled
- [ ] Error messages helpful
- [ ] Success messages shown
- [ ] Loading states visible
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works
- [ ] Tab order logical

### 9.2 Mobile App
- [ ] Loads quickly
- [ ] Responsive layout on various screen sizes
- [ ] Touch targets appropriate size
- [ ] Forms easy to fill on mobile
- [ ] Buttons not too close together
- [ ] Text readable without zooming

### 9.3 API Documentation
- [ ] All endpoints documented
- [ ] Example requests provided
- [ ] Example responses provided
- [ ] Error codes explained
- [ ] Authentication explained
- [ ] Rate limits documented
- [ ] Easy to understand

---

## 10. Accessibility Testing

### 10.1 Visual
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Text readable
- [ ] Icons have alt text
- [ ] Images have alt text
- [ ] Zoom works up to 200%
- [ ] No color-only information

### 10.2 Keyboard Navigation
- [ ] All interactive elements accessible
- [ ] Tab order logical
- [ ] Focus visible
- [ ] No keyboard traps
- [ ] Skip links present

### 10.3 Screen Reader
- [ ] Form labels associated with inputs
- [ ] Buttons have proper names
- [ ] Page structure correct (headings)
- [ ] Table headers marked up
- [ ] Lists properly marked
- [ ] Live regions announced

---

## 11. Compatibility Testing

### 11.1 Browser Compatibility
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest version)
- [ ] Mobile browsers (Chrome, Safari)

### 11.2 Device Compatibility
- [ ] Desktop 1920x1080
- [ ] Desktop 1366x768
- [ ] Tablet 768px width
- [ ] Mobile 375px width
- [ ] Mobile 768px width

### 11.3 OS Compatibility
- [ ] Windows 10/11
- [ ] macOS latest
- [ ] Ubuntu/Linux
- [ ] iOS latest
- [ ] Android latest

---

## 12. Regression Testing

### 12.1 After Bug Fixes
- [ ] Original issue fixed
- [ ] No new issues introduced
- [ ] Related features still work
- [ ] Data integrity maintained

### 12.2 After Updates
- [ ] All existing tests pass
- [ ] No feature regressions
- [ ] Performance maintained
- [ ] Security maintained

---

## 13. User Acceptance Testing (UAT)

### 13.1 Business Requirements
- [ ] Families can track points
- [ ] Leaderboards work correctly
- [ ] Points can be awarded
- [ ] Reports can be generated
- [ ] Excel import works
- [ ] Mobile app shows leaderboard
- [ ] Event management works (if applicable)

### 13.2 User Scenarios
- [ ] Admin can set up families
- [ ] Shopkeeper can award points
- [ ] User can view their profile
- [ ] User can see leaderboard
- [ ] Family head can view family
- [ ] Event organizer can manage event

---

## 14. Bug Tracking

### 14.1 Bug Report Template
```
Title: [Brief description]
Environment: [Dev/Staging/Prod]
Steps to Reproduce:
1. [First step]
2. [Second step]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Screenshots: [Attach if applicable]
Browser/Device: [Details]
Severity: [Critical/High/Medium/Low]
```

### 14.2 Severity Levels
- **Critical**: System down, data loss, security issue
- **High**: Major feature broken, workaround exists
- **Medium**: Minor feature broken, can continue testing
- **Low**: Minor UI issue, typo, cosmetic

---

## 15. Test Case Execution Log

### Test Environment
- **Backend URL**: http://localhost:5000/api
- **Admin URL**: http://localhost:3000
- **Mobile URL**: Expo Go
- **Database**: In-memory
- **Tester**: [Name]
- **Date**: [Date]

### Execution Summary
| Feature | Total Cases | Passed | Failed | Blocked |
|---------|------------|--------|--------|---------|
| Authentication | 12 | [ ] | [ ] | [ ] |
| User Management | 15 | [ ] | [ ] | [ ] |
| Family Management | 18 | [ ] | [ ] | [ ] |
| Points System | 20 | [ ] | [ ] | [ ] |
| Stall Management | 12 | [ ] | [ ] | [ ] |
| Performance | 8 | [ ] | [ ] | [ ] |
| Security | 20 | [ ] | [ ] | [ ] |
| **TOTAL** | **105** | [ ] | [ ] | [ ] |

### Pass Rate: ____ / 105 (__%)

---

## 16. Sign-Off

### Development Team
- [ ] Code Review Complete
- [ ] All Tests Passing
- [ ] Documentation Updated
- [ ] No Known Critical Issues

**Developer Name**: _________________ **Date**: _________

### QA Team
- [ ] Functional Testing Complete
- [ ] Performance Testing Complete
- [ ] Security Testing Complete
- [ ] All High/Critical Issues Resolved

**QA Lead Name**: _________________ **Date**: _________

### Business
- [ ] Requirements Met
- [ ] UAT Passed
- [ ] Ready for Release

**Business Owner**: _________________ **Date**: _________

---

## 17. Post-Release

### 17.1 Monitoring
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] No database issues
- [ ] No security alerts
- [ ] User feedback positive

### 17.2 Hotfix Criteria
- [ ] Critical bug identified
- [ ] Affects main functionality
- [ ] Cannot wait for next release
- [ ] Fix developed and tested
- [ ] Deployment plan documented

---

## Appendix: Tools & Resources

### Testing Tools
- **API Testing**: Postman, Insomnia, REST Client
- **Performance**: JMeter, Artillery, Apache Bench
- **Security**: OWASP ZAP, Burp Suite Community
- **Accessibility**: WAVE, Axe DevTools, Lighthouse
- **Browser Testing**: BrowserStack, Sauce Labs

### Documentation References
- API Testing Guide: `API_TESTING_GUIDE.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Architecture: `ARCHITECTURE.md`
- Event Day Manual: `EVENT_DAY_MANUAL.md`

---

**Last Updated:** January 15, 2024
**Version:** 1.0
**Owner:** QA Team
