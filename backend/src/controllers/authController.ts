import { Request, Response } from 'express';
import { validateUserCredentials, updateUserProfile, createUser } from '../services/userService';
import { db } from '../config/storage';
import { generateToken } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email or phone number and password are required' });
      return;
    }

    const user = await validateUserCredentials(email, password);
    const token = generateToken(user._id?.toString() || '', user.role, user.isSuperUser);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isSuperUser: user.isSuperUser,
        familyId: user.familyId,
      },
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, name, email, phone, password, role, familyId, house, validationCode, isSuperUser, inviteToken, isAdminCreated, address, occupation, gender, countryCode } = req.body;

    // Support both name (mobile) and firstName/lastName (admin)
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (!firstName && name) {
      const nameParts = name.trim().split(' ');
      userFirstName = nameParts[0] || 'User';
      userLastName = nameParts.slice(1).join(' ') || 'Family';
    }

    if (!userFirstName || !phone || !password || !house) {
      res.status(400).json({ message: 'Missing required fields: firstName, phone, password, and house are required' });
      return;
    }

    // Validate house
    const validHouses = ['Kadannamanna', 'Ayiranazhi', 'Aripra', 'Mankada'];
    if (!validHouses.includes(house)) {
      res.status(400).json({ message: 'Invalid house. Must be one of: Kadannamanna, Ayiranazhi, Aripra, Mankada' });
      return;
    }

    const normalizedEmail = email.toLowerCase();
    let finalRole = role || 'user';

    // Super user bypass - no email restriction or invite token required
    const allowSuperUser = isSuperUser === true;

    // Validate invite token (required for self-registration, but not for admin-created users or super users)
    if (!allowSuperUser && !isAdminCreated) {
      if (!inviteToken) {
        res.status(400).json({ message: 'Invite token is required for registration' });
        return;
      }

      const tokenRecord = await db.findOne('inviteTokens', { token: inviteToken });
      if (!tokenRecord) {
        res.status(400).json({ message: 'Invalid invite token' });
        return;
      }
      if (tokenRecord.used) {
        res.status(400).json({ message: 'Invite token already used' });
        return;
      }
      if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
        res.status(400).json({ message: 'Invite token expired' });
        return;
      }
    }

    if (finalRole === 'admin' && !allowSuperUser) {
      if (!validationCode) {
        res.status(400).json({ message: 'Admin registration requires validationCode' });
        return;
      }
      // Validate admin code
      const codeRecord = await db.findOne('adminCodes', { code: validationCode });
      if (!codeRecord) {
        res.status(400).json({ message: 'Invalid validation code' });
        return;
      }
      if (codeRecord.used) {
        res.status(400).json({ message: 'Validation code already used' });
        return;
      }
      if (new Date(codeRecord.expiresAt).getTime() < Date.now()) {
        res.status(400).json({ message: 'Validation code expired' });
        return;
      }
      // Mark code used
      await db.updateOne('adminCodes', { _id: codeRecord._id }, { used: true, usedAt: new Date() });
    }

    const user = await createUser({
      firstName: userFirstName,
      lastName: userLastName || '',
      email: normalizedEmail,
      phone,
      countryCode: countryCode || '+91',
      password,
      role: finalRole,
      house,
      isSuperUser: !!allowSuperUser,
      familyId: familyId || 'family-default',
      address: address || '',
      occupation: occupation || '',
      gender: gender || 'male',
    });

    // Mark invite token as used (if not super user)
    if (!allowSuperUser && inviteToken) {
      await db.updateOne('inviteTokens', { token: inviteToken }, {
        used: true,
        usedBy: user._id,
        usedAt: new Date(),
      });
    }

    const token = generateToken(user._id?.toString() || '', user.role, user.isSuperUser);
    const { password: _, ...safeUser } = user;

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, profession, address } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const allowedUpdates: any = {};
    if (firstName !== undefined) allowedUpdates.firstName = firstName;
    if (lastName !== undefined) allowedUpdates.lastName = lastName;
    if (dateOfBirth !== undefined) allowedUpdates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) allowedUpdates.gender = gender;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (profession !== undefined) allowedUpdates.profession = profession;
    if (address !== undefined) allowedUpdates.address = address;

    const updatedUser = await updateUserProfile(userId, allowedUpdates);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await updateUserProfile(userId, {});

    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' });
      return;
    }

    // Get user
    const user = await db.findById('users', userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update('users', userId, { password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
