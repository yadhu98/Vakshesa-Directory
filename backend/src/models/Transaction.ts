import { Schema, model } from 'mongoose';

export interface ITransaction {
  _id?: string;
  userId: string;
  stallId?: string;
  type: 'purchase' | 'refund' | 'recharge' | 'deduction' | 'transfer';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stallId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'refund', 'recharge', 'deduction', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ stallId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
