# Super Admin Features - Complete Control Panel

## Overview
Super admin has complete control over all aspects of the Vksha system including users, events, and carnival stalls.

## 🎯 Features Implemented

### 1. **User Management** (`/users`)
Super admin can manage all users with comprehensive controls:

#### View & Search
- View all registered users in a searchable table
- Filter by role (User/Admin/Shopkeeper)
- Search by name, email, or phone

#### Edit User
- **Click "✏️ Edit" button** on any user
- Update user information:
  - First Name & Last Name
  - Email address
  - Phone number
  - **Role** (User/Admin/Shopkeeper)
  - **Active status**

#### Activate/Deactivate
- **Toggle switch** in Actions column
- Green = Active, Gray = Inactive
- Instantly enable or disable user accounts

#### Add New User
- Click "+ Add User" button
- Register new users directly from admin panel

---

### 2. **Carnival Events Management** (`/events`)
Full control over carnival events (main event containers):

#### Create Events
- Create new carnival events with:
  - Event name & description
  - Start and end dates
  - Location
  - Status (Upcoming/Active/Completed)
  - Maximum points
  - Banner image URL

#### Edit Events
- **Click "Edit" button** on any event
- Modify all event properties
- Change status and dates as needed

#### Delete Events
- Remove events that are no longer needed
- Confirmation required before deletion

#### Status Management
- Change event status: Upcoming → Active → Completed
- Toggle Phase 2 activation for events

---

### 3. **Stalls/Games Management** (`/stalls`)
Complete control over carnival stalls, games, and stage programs:

#### View All Stalls
- See all created stalls across all carnivals
- Visual cards showing:
  - Category (🎮 Game / 🎭 Stage Program)
  - Status (Active/Inactive, Open/Closed)
  - Token cost for games
  - Volunteer names
  - Participation statistics

#### Create Stalls
- Select carnival event
- Choose category:
  - **Game**: Requires tokens, has rules
  - **Stage Program**: Free entry, registration form
- Set participation type (Individual/Group/Both)
- Assign multiple volunteers/admins
- Configure token cost (games only)
- Add game rules
- Set location, timing, max participants

#### Edit Stalls
- **Click "✏️" button** on any stall
- Update all stall properties:
  - Name, description
  - Category and type
  - Volunteer assignments
  - Token cost and game rules
  - Participation type
  - Location and timing
  - Maximum participants

#### Delete Stalls
- **Click "🗑️" button** to remove stalls
- Cannot delete stalls with existing participations
- Confirmation required

#### Control Stall Status
- **Click "▶️/⏸️" button** to open/close stalls
- Open = accepting participants
- Closed = temporarily disabled

#### QR Code Management
- **Click "📱 QR" button** to view/download QR code
- QR codes used by participants to join events

---

## 🔐 Permission System

### Super Admin (Role: 'admin')
**Can do everything:**
- ✅ Edit any user's role and permissions
- ✅ Create, edit, delete carnival events
- ✅ Create, edit, delete stalls/games
- ✅ Assign volunteers to stalls
- ✅ Toggle event and stall statuses
- ✅ View all participation data
- ✅ Access all admin panels

### Regular Users (Role: 'user')
**Limited to:**
- Participate in events via mobile app
- View their own profile and points
- Scan QR codes to join games

### Volunteers (Selected by Admin)
**Can do:**
- Manage assigned stalls via mobile app
- View participants for their events
- Award points to participants
- Open/close their assigned events

### Shopkeepers (Role: 'shopkeeper')
**Can do:**
- Manage their shops
- Process token purchases
- View shop statistics

---

## 🚀 How to Use Super Admin Features

### Managing Users
1. Navigate to `/users`
2. **To edit a user:**
   - Click "✏️ Edit" button
   - Modify fields in the modal
   - Click "Update User"
3. **To change role:**
   - Edit user → Change role dropdown → Save
4. **To activate/deactivate:**
   - Toggle the switch in Actions column

### Managing Carnival Events
1. Navigate to `/events`
2. **To create:**
   - Click "+ Create Event"
   - Fill in event details
   - Submit
3. **To edit:**
   - Click "Edit" on event card
   - Modify details
   - Save changes
4. **To delete:**
   - Click "Delete" button
   - Confirm deletion

### Managing Stalls/Games
1. Navigate to `/stalls`
2. **To create:**
   - Click "+ Create Stall"
   - Select carnival
   - Choose category (Game/Stage)
   - Select volunteers (can select multiple users)
   - Configure details
   - Submit
3. **To edit:**
   - Click "✏️" icon on stall card
   - Modify any details
   - Update volunteers if needed
   - Save
4. **To open/close:**
   - Click "▶️" (closed) or "⏸️" (open) button
5. **To delete:**
   - Click "🗑️" icon
   - Confirm (only if no participations exist)

---

## 💡 Pro Tips

### User Management
- Assign 'admin' role to trusted users for delegation
- Keep inactive users for historical data
- Use search to quickly find users

### Event Management
- Create events before creating stalls
- Set status to 'active' when carnival starts
- Use Phase 2 for extended carnival periods

### Stall Management
- Select multiple volunteers for popular stalls
- Stage programs should have tokenCost = 0
- Add clear game rules for better UX
- Close stalls during breaks, don't delete them

---

## 🔧 Backend APIs Used

### User APIs
- `GET /api/bulk/users` - List all users
- `PUT /api/users/:userId` - Update user details
- `PATCH /api/users/:userId/status` - Toggle active status

### Event APIs
- `GET /api/events` - List all carnivals
- `POST /api/events` - Create carnival
- `PUT /api/events/:eventId` - Update carnival
- `DELETE /api/events/:eventId` - Delete carnival
- `PATCH /api/events/:eventId/status` - Update status
- `PATCH /api/events/:eventId/phase2` - Toggle Phase 2

### Stall APIs
- `GET /api/carnival-admin/events` - List all stalls
- `POST /api/carnival-admin/events` - Create stall
- `PUT /api/carnival-admin/events/:eventId` - Update stall
- `DELETE /api/carnival-admin/events/:eventId` - Delete stall
- `PATCH /api/carnival-admin/events/:eventId/toggle` - Open/close stall
- `GET /api/carnival-admin/users` - Get users for volunteer selection

---

## ✅ Summary

Super admin has **complete control** over:
1. ✅ User permissions and roles
2. ✅ Carnival events (create/edit/delete)
3. ✅ Stalls and games (create/edit/delete)
4. ✅ Volunteer assignments
5. ✅ Event status management
6. ✅ User account activation

All critical operations require confirmation dialogs to prevent accidental changes.
