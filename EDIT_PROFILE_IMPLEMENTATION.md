# Edit Profile & Change Password - Mobile App

## Features Added

### 1. Edit Profile Screen ✅
**File:** `mobile/src/screens/EditProfileScreen.tsx`

**Features:**
- Edit first name and last name
- Edit phone number
- Edit profession
- Form validation (required fields, phone length)
- Save button with loading state
- Link to Change Password screen
- Auto-loads current user data
- Updates local storage after save

**API Endpoint:** `PUT /auth/profile`
- Accepts: firstName, lastName, phone, profession
- Requires authentication (JWT token)

**Navigation:**
- Access from: Profile Screen → "Edit Profile" button
- Back navigation after successful save

---

### 2. Change Password Screen ✅
**File:** `mobile/src/screens/ChangePasswordScreen.tsx`

**Features:**
- Current password field
- New password field (min 8 characters)
- Confirm new password field
- Password visibility toggle (👁️/🙈 icons)
- Password requirements display
- Validation:
  - All fields required
  - New password min 8 characters
  - Passwords must match
  - New password must differ from current
- Loading state during submission
- Success/error alerts

**API Endpoint:** `PUT /auth/change-password`
- Accepts: currentPassword, newPassword
- Requires authentication (JWT token)
- Backend validates current password
- Backend enforces min 6 characters

**Navigation:**
- Access from: Edit Profile Screen → "🔒 Change Password" button
- Back navigation after successful change

---

## Navigation Setup

**File:** `mobile/src/navigation/RootNavigator.tsx`

Added two new screens to authenticated stack:
```typescript
<Stack.Screen name="EditProfile" component={EditProfileScreen} />
<Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
```

---

## Backend Updates

**File:** `backend/src/controllers/authController.ts`

**Updated `updateProfile` function:**
- Now accepts `phone` and `profession` fields
- Only updates fields that are provided
- Returns updated user data

**Existing endpoints used:**
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

---

## User Flow

### Edit Profile Flow:
1. User views profile → Taps "Edit Profile"
2. EditProfileScreen loads with current data
3. User edits fields (firstName, lastName, phone, profession)
4. User taps "Save Changes"
5. Validation runs
6. API call to `/auth/profile`
7. Local storage updated
8. Success alert → Navigate back to profile

### Change Password Flow:
1. User taps "Edit Profile" → Taps "🔒 Change Password"
2. ChangePasswordScreen displays
3. User enters:
   - Current password
   - New password
   - Confirm new password
4. User can toggle password visibility
5. User taps "Change Password"
6. Validation runs
7. API call to `/auth/change-password`
8. Success alert → Navigate back

---

## Validation Rules

### Edit Profile:
- ✅ First name: Required, cannot be empty
- ✅ Last name: Required, cannot be empty
- ✅ Phone: Optional, min 10 digits if provided
- ✅ Profession: Optional

### Change Password:
- ✅ Current password: Required
- ✅ New password: Required, min 8 characters
- ✅ Confirm password: Required, must match new password
- ✅ New password must differ from current password

---

## UI Features

### Edit Profile Screen:
- Clean white card design
- Section title: "Personal Information"
- Label above each input field
- Gray background for inputs
- Black save button
- White bordered "Change Password" button
- Loading spinner during save

### Change Password Screen:
- Password fields with eye icon toggle
- Gray info box showing password requirements
- Black submit button
- Loading spinner during submission
- Clear error messages

---

## Error Handling

### Edit Profile:
- Invalid phone number
- Empty required fields
- Network errors
- API errors (duplicate phone, etc.)

### Change Password:
- Incorrect current password
- Password too short
- Passwords don't match
- New password same as current
- Network errors

---

## Testing Checklist

### Edit Profile:
- [ ] Load profile data correctly
- [ ] Edit first name and save
- [ ] Edit last name and save
- [ ] Edit phone and save
- [ ] Edit profession and save
- [ ] Empty first name shows error
- [ ] Empty last name shows error
- [ ] Phone < 10 digits shows error
- [ ] Success alert appears
- [ ] Navigate back after save
- [ ] Profile screen shows updated data

### Change Password:
- [ ] Empty fields show error
- [ ] New password < 8 chars shows error
- [ ] Passwords don't match shows error
- [ ] Same password shows error
- [ ] Toggle password visibility works
- [ ] Incorrect current password shows error
- [ ] Correct passwords work
- [ ] Success alert appears
- [ ] Navigate back after change
- [ ] Can login with new password

---

## File Summary

**Created:**
- `mobile/src/screens/EditProfileScreen.tsx` (~280 lines)
- `mobile/src/screens/ChangePasswordScreen.tsx` (~250 lines)

**Modified:**
- `mobile/src/navigation/RootNavigator.tsx` - Added 2 new screens
- `backend/src/controllers/authController.ts` - Enhanced updateProfile to accept phone/profession

**Existing (used):**
- `mobile/src/screens/EnhancedProfileScreen.tsx` - Already has "Edit Profile" button
- Backend API endpoints already exist

---

## API Reference

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "profession": "Engineer"
}

Response:
{
  "message": "Profile updated successfully",
  "user": { ...updatedUserData }
}
```

### Change Password
```
PUT /auth/change-password
Authorization: Bearer <token>

Body:
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass456"
}

Response:
{
  "message": "Password changed successfully"
}

Errors:
- 401: Unauthorized
- 400: Invalid current password
- 400: New password too short
```

---

## Notes

- Both screens require authentication
- Profile updates are immediately reflected in local storage
- Password change requires re-entering current password for security
- All API calls use JWT token from AsyncStorage
- Form validation happens before API calls to reduce server load
- Loading states prevent multiple submissions
