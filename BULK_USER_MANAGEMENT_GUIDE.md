# Bulk User Management Guide

This guide explains how to use the new bulk user management features in the admin panel.

## Features Added

### 1. Delete All Users (Except Super Admins)
- **Location**: Users Management page → "Delete All Users" button (red, top right)
- **Purpose**: Remove all regular users while preserving super admin accounts
- **Safety**: Requires typing `DELETE_ALL_USERS` to confirm

### 2. Import Users from CSV
- **Location**: Users Management page → "Import Users" button (black, top right)
- **Purpose**: Bulk import multiple users from a CSV file
- **Formats**: Supports CSV files

## How to Delete All Users

1. Navigate to **Users Management** page
2. Click the **"Delete All Users"** button (red button with trash icon)
3. A confirmation modal will appear
4. Type exactly `DELETE_ALL_USERS` in the text field
5. Click **"Delete All"** button
6. All users except super admins will be deleted
7. You'll see a success message with the count of deleted users

**Safety Features**:
- Super admin accounts are automatically preserved
- Requires exact confirmation text
- Shows count of preserved super admins
- Action cannot be undone

## How to Import Users from CSV

### Step 1: Prepare Your CSV File

Create a CSV file with the following columns:

**Required Columns**:
- `firstName` - User's first name
- `lastName` - User's last name
- `email` - User's email (must be unique)

**Optional Columns**:
- `phone` - Phone number
- `password` - Custom password (default: `Password123!`)
- `role` - user, admin, or shopkeeper (default: `user`)
- `house` - House name (default: `Kadannamanna`)
- `gender` - male, female, or other
- `generation` - Generation number
- `address` - Full address
- `profession` - User's profession

### Step 2: Sample CSV Format

```csv
firstName,lastName,email,phone,password,role,house,gender,generation,address,profession
John,Doe,john.doe@example.com,9876543210,Pass123!,user,Kadannamanna,male,1,123 Main St,Engineer
Jane,Smith,jane.smith@example.com,9876543211,Pass123!,user,Kadannamanna,female,1,456 Oak Ave,Doctor
Mike,Johnson,mike.j@example.com,9876543212,Pass123!,shopkeeper,Kadannamanna,male,2,789 Pine Rd,Shopkeeper
```

A sample file is included: `admin/sample_users_import.csv`

### Step 3: Import Process

1. Navigate to **Users Management** page
2. Click the **"Import Users"** button (black button with upload icon)
3. A modal will open showing the CSV format
4. Click the **file upload area** or drag and drop your CSV file
5. Preview the first 10 users to verify the data
6. Review the total count of users to be imported
7. Click **"Import X Users"** button to proceed
8. Wait for the import to complete
9. You'll see a success message with:
   - Number of users successfully created
   - Number of failed imports (if any)

### Step 4: What Happens During Import

**Validation**:
- Checks for required fields (firstName, lastName, email)
- Validates email format
- Checks for duplicate emails (existing users are skipped)

**Default Values**:
- Password: `Password123!` (if not provided)
- Role: `user` (if not provided)
- House: `Kadannamanna` (if not provided)
- FamilyId: `family-default` (if not provided)

**Error Handling**:
- Duplicate emails are skipped with an error message
- Invalid data rows are reported in the results
- Successful imports proceed even if some fail

## Backend API Endpoints

### Delete All Users
```
DELETE /bulk/delete-all-users
Authorization: Required (Admin only)

Request Body:
{
  "confirmCode": "DELETE_ALL_USERS"
}

Response:
{
  "message": "Successfully deleted X users",
  "deletedCount": 25,
  "superAdminsPreserved": 2,
  "errors": []
}
```

### Import Users
```
POST /bulk/import-users
Authorization: Required (Admin only)

Request Body:
{
  "users": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "password": "Pass123!",
      "role": "user",
      "house": "Kadannamanna",
      "gender": "male",
      "generation": "1",
      "address": "123 Main St",
      "profession": "Engineer"
    }
  ]
}

Response:
{
  "message": "Successfully imported 5 users",
  "created": 5,
  "failed": 0,
  "errors": []
}
```

## UI Updates

All user management UI now uses:
- **Black/White color scheme** (consistent with design system)
- **Lucide React icons** (Upload, Trash2, X, FileText)
- **Responsive modals** with proper overflow handling
- **Clear visual feedback** for all operations

## Testing Checklist

Before deploying to production:

- [ ] Test delete all users with super admin preservation
- [ ] Test import with valid CSV (all columns)
- [ ] Test import with minimal CSV (only required columns)
- [ ] Test import with duplicate emails
- [ ] Test import with missing required fields
- [ ] Test import with large files (100+ users)
- [ ] Verify user counts update correctly after operations
- [ ] Test modal close buttons and cancel actions
- [ ] Verify confirmation modal requires exact text
- [ ] Test CSV preview display (10+ users)
- [ ] Check error messages are clear and helpful

## Security Notes

- Both operations require admin authentication
- Delete operation requires explicit confirmation code
- Super admin accounts cannot be deleted via bulk delete
- Import validates all email addresses
- Passwords are hashed before storage (handled by backend)
- All operations are logged for audit purposes

## Troubleshooting

**Problem**: Import button is disabled
- **Solution**: Upload a valid CSV file first

**Problem**: Delete button is disabled
- **Solution**: Type the exact confirmation text: `DELETE_ALL_USERS`

**Problem**: CSV import fails
- **Solution**: Check that required columns (firstName, lastName, email) are present

**Problem**: Some users fail to import
- **Solution**: Check the error messages in the success dialog for specific reasons (likely duplicate emails)

**Problem**: Dashboard still shows old user count
- **Solution**: Refresh the page or navigate away and back

## File Locations

**Frontend**:
- Users page: `admin/src/pages/Users.tsx`
- API service: `admin/src/services/api.ts`
- Sample CSV: `admin/sample_users_import.csv`

**Backend**:
- Routes: `backend/src/routes/bulk.ts`
- Lines: 343-443 (new endpoints)

## Default Credentials After Import

All imported users (without custom password) will have:
- **Password**: `Password123!`
- **Status**: Active
- **Family**: family-default (unless specified)
- **House**: Kadannamanna (unless specified)

**Important**: Advise users to change their password after first login.

---

Last Updated: 2024
