import { Schema, model } from 'mongoose';

export interface Token {
  _id?: string;
  userId: string;
  balance: number;
  totalRecharged: number;
  totalSpent: number;
  qrCode: string; // Unique QR code for user
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<Token>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRecharged: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const TokenModel = model<Token>('Token', tokenSchema);

export interface Transaction {
  _id: string;
  userId: string;
  stallId: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  tokensUsed: number;
  status: 'pending' | 'completed' | 'declined' | 'cancelled';
  adminId?: string; // For recharges
  shopkeeperId?: string; // For payments
  description?: string;
  gameScore?: number; // For gaming stalls
  qrCodeScanned?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface StallVisit {
  _id: string;
  userId: string;
  stallId: string;
  transactionId: string;
  tokensSpent: number;
  gameScore?: number;
  visitedAt: Date;
}

export interface RechargeConfig {
  _id: string;
  eventId: string;
  amountToTokenRatio: number; // e.g., 1 INR = 2 tokens
  minRecharge: number;
  maxRecharge: number;
  isActive: boolean;
}
