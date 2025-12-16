import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (id: string, role: string, isSuperUser?: boolean): string => {
  return jwt.sign(
    { id, role, isSuperUser: isSuperUser || false },
    (process.env.JWT_SECRET || 'secret') as string,
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '10'));
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateQRCode = async (data: string): Promise<string> => {
  const QRCode = require('qrcode');
  return QRCode.toDataURL(data);
};
