import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/storage';
import { hasApprovedMembership } from '../services/membership';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    isSuperUser?: boolean;
    familyId?: string;
  };
  body: any;
  params: any;
  query: any;
  headers: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await db.findById('users', String(decoded.id));
    if (!user || user.isActive === false) {
      res.status(401).json({ message: 'Account is unavailable' });
      return;
    }
    if (user.membershipStatus === 'Pending') {
      res.status(403).json({ code: 'MEMBERSHIP_PENDING', message: 'Your registration is waiting for admin approval' });
      return;
    }
    if (user.membershipStatus === 'Rejected') {
      res.status(403).json({ code: 'MEMBERSHIP_REJECTED', message: user.membershipRejectionReason || 'Your registration was rejected' });
      return;
    }
    if (!hasApprovedMembership(user)) {
      res.status(403).json({ message: 'Account approval is required to access this service' });
      return;
    }
    req.user = {
      id: String(user._id),
      role: user.role,
      isSuperUser: !!user.isSuperUser,
      familyId: user.familyId,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin' && !req.user?.isSuperUser) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

export const shopkeeperMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin' && !req.user?.isSuperUser) {
    res.status(403).json({ message: 'Shopkeeper or admin access required' });
    return;
  }
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);
  const uploadError = err instanceof Error && (err.name === 'MulterError' || err.message === 'Images must be JPG, PNG, or WEBP');
  res.status(err.status || (uploadError ? 400 : 500)).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
