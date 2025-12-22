# Invite-Only Registration System Guide

## Overview

The Vakshesa Directory now uses an invite-only registration system to ensure only authorized individuals can join the platform.

## How It Works

### For Regular Users (Self-Registration)

1. **Cannot register directly** - The "Register" link has been removed from the login page
2. **Requires an invite link** - Must receive an invitation from an existing member
3. **One-time use tokens** - Each invite token can only be used once
4. **7-day expiration** - Invite links expire after 7 days

### For Admin-Created Users

Admins can create users through three methods, all of which **bypass the invite requirement**:

#### Method 1: Bulk Import (Most Common)
- Users are created with passwords via CSV/JSON import
- These users can log in immediately using their credentials
- No registration needed - they use the login endpoint directly

#### Method 2: Admin Panel User Creation
- Admins can create individual users via `POST /api/admin/create-user`
- User is created with a password set by the admin
- User can log in immediately with provided credentials

#### Method 3: Registration with Admin Flag
- If you need a user to complete their own registration after admin creates a record
- Pass `isAdminCreated: true` in the registration request body
- This bypasses the invite token requirement

## User Creation Flows

### Flow 1: Self-Registration (Requires Invite)
```
Existing Member → Clicks "Invite New Member" → Gets Invite Link
    ↓
Shares Link → New User → Clicks Link → Validates Token → Registers
    ↓
Token Marked as Used → User Account Created
```

### Flow 2: Admin Bulk Import (No Invite Required)
```
Admin → Uploads CSV → Users Created with Passwords
    ↓
Users Log In Directly (No Registration Needed)
```

### Flow 3: Admin Creates Individual User (No Invite Required)
```
Admin → POST /api/admin/create-user → User Created with Password
    ↓
User Logs In Directly (No Registration Needed)
```

## API Endpoints

### Invite Management

#### Generate Invite Token
```http
POST /api/invites/create
Authorization: Bearer <token>

Response:
{
  "token": "abc123...",
  "expiresAt": "2025-12-29T...",
  "inviteLink": "http://localhost:3001/register?invite=abc123..."
}
```

#### Validate Invite Token
```http
GET /api/invites/validate/:token

Response:
{
  "valid": true,
  "message": "Invite token is valid",
  "createdByName": "John Doe"
}
```

#### Get My Invites
```http
GET /api/invites/my-invites
Authorization: Bearer <token>

Response:
{
  "invites": [
    {
      "token": "abc123...",
      "used": false,
      "expiresAt": "2025-12-29T...",
      "inviteLink": "..."
    }
  ]
}
```

### Admin User Creation

#### Create User (Admin Only)
```http
POST /api/admin/create-user
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "house": "Kadannamanna",
  "role": "user",
  "gender": "female",
  "generation": 2,
  "address": "123 Main St",
  "profession": "Engineer"
}

Response:
{
  "message": "User created successfully by admin",
  "user": { ... }
}
```

### Registration

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "house": "Kadannamanna",
  "inviteToken": "abc123...",  // Required for self-registration
  "isAdminCreated": false      // Set to true if admin-created (bypasses invite)
}
```

## Security Features

1. **Token Expiration**: Invite tokens expire after 7 days
2. **Single Use**: Each token can only be used once
3. **Token Validation**: Tokens are validated before registration
4. **Admin Control**: Only authenticated users can generate invites
5. **Audit Trail**: System tracks who created each invite and when it was used

## Database Schema

### Invite Tokens Collection
```javascript
{
  token: String,           // Unique 64-character hex token
  createdBy: String,       // User ID who created the invite
  createdByName: String,   // Name of inviter (for display)
  email: String,           // Optional: specific email for invite
  used: Boolean,           // Whether token has been used
  usedBy: String,          // User ID who used the token
  usedAt: Date,            // When token was used
  expiresAt: Date,         // Token expiration date
  createdAt: Date          // Token creation date
}
```

## UI Components

### Directory Screen
- "Invite New Member" button (visible to all logged-in users)
- Modal showing generated invite link
- Copy to clipboard functionality

### Registration Screen
- Validates invite token from URL query parameter
- Shows inviter's name when valid
- Displays error if invite is invalid/expired
- Hides registration form if no valid invite

### Login Screen
- "Register" link removed (no public registration)

## Common Scenarios

### Scenario 1: Inviting a Family Member
1. Log in to the directory
2. Click "Invite New Member"
3. Copy the generated link
4. Share via email/SMS with the new member
5. New member clicks link and completes registration

### Scenario 2: Bulk Adding Members
1. Admin prepares CSV with member details (including passwords)
2. Admin uploads via bulk import
3. Members receive their credentials separately
4. Members log in directly (no registration)

### Scenario 3: Admin Creates Single User
1. Admin calls `POST /api/admin/create-user` with user details
2. User receives credentials from admin
3. User logs in directly

## Troubleshooting

### "Invite token is required for registration"
- User tried to register without an invite link
- Solution: Get an invite link from an existing member

### "Invalid invite token"
- Token doesn't exist in the database
- Solution: Request a new invite link

### "Invite token already used"
- Token has been used by someone else
- Solution: Request a new invite link

### "Invite token expired"
- Token is older than 7 days
- Solution: Request a new invite link

### Admin-created users can't log in
- If created via bulk import or admin endpoint, users should log in directly
- They don't need to go through registration
- Check that password was set correctly during creation

## Future Enhancements

Potential improvements for the invite system:

1. **Email-specific invites**: Restrict invite to a specific email address
2. **Invite analytics**: Track invite acceptance rates
3. **Bulk invite generation**: Create multiple invites at once
4. **Invite templates**: Pre-fill certain fields based on invite
5. **Admin notification**: Alert admins when new users register
6. **Invite expiry customization**: Allow custom expiration periods
