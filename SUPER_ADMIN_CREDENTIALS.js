/**
 * Super Admin Account
 * 
 * This account is automatically created on server startup if it doesn't exist.
 * 
 * Credentials:
 * Email: admin@vakshesa.com
 * Password: Vakshesa@2025
 * 
 * Role: admin
 * House: Kadannamanna
 * Phone: +919999999999
 * 
 * This account will persist across server restarts.
 * To reset the password, update it through the backend or change-password endpoint.
 */

// The super admin is initialized in backend/src/index.ts
// on every server startup. If the account exists, it won't be recreated.

module.exports = {
  email: 'admin@vakshesa.com',
  password: 'Vakshesa@2025',
  role: 'admin',
};
