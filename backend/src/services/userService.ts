import { db } from '../config/storage';
import { hashPassword, comparePassword } from '../utils/auth';

export const createUser = async (userData: any) => {
  // Check for existing email only if email is provided
  if (userData.email) {
    const existingEmail = await db.findOne('users', { email: userData.email });
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }
  }
  
  const existingPhone = await db.findOne('users', { phone: userData.phone });
  if (existingPhone) {
    throw new Error('User with this phone number already exists');
  }

  const hashedPassword = await hashPassword(userData.password);

  return db.create('users', {
    ...userData,
    password: hashedPassword,
  });
};

export const validateUserCredentials = async (emailOrPhone: string, password: string) => {
  // Try to find user by email first
  let user = await db.findOne('users', { email: emailOrPhone.toLowerCase() });
  
  if (!user) {
    // Try to find by exact phone match
    user = await db.findOne('users', { phone: emailOrPhone });
  }
  
  if (!user) {
    // Try to find by normalized phone (remove all non-digits and match last 10 digits)
    const normalizedInput = emailOrPhone.replace(/\D/g, '');
    if (normalizedInput.length >= 10) {
      const last10Digits = normalizedInput.slice(-10);
      // Get all users and check if any phone ends with these digits
      const allUsers = await db.find('users', {});
      user = allUsers.find((u: any) => {
        const userPhone = (u.phone || '').replace(/\D/g, '');
        return userPhone.slice(-10) === last10Digits;
      }) || null;
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return user;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const user = await db.updateOne('users', { _id: userId }, updates);
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
