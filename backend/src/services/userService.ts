import { db } from '../config/storage';
import { hashPassword, comparePassword } from '../utils/auth';

export const createUser = async (userData: any) => {
  const existingEmail = await db.findOne('users', { email: userData.email });
  const existingPhone = await db.findOne('users', { phone: userData.phone });
  
  if (existingEmail || existingPhone) {
    throw new Error('User with this email or phone already exists');
  }

  const hashedPassword = await hashPassword(userData.password);

  return db.create('users', {
    ...userData,
    password: hashedPassword,
  });
};

export const validateUserCredentials = async (email: string, password: string) => {
  const user = await db.findOne('users', { email });

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
