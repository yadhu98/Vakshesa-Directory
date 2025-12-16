import { Request, Response } from 'express';
import { db } from '../config/storage';
import { AuthRequest } from '../middleware/auth';
import * as QRCode from 'qrcode';
import { wsService } from '../services/websocket';

// Generate unique QR code for user
export const generateUserQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if user already has a token account
    let tokenAccount = await db.findOne('tokens', { userId });
    
    if (!tokenAccount) {
      // Create new token account with unique QR code
      const qrCode = `VKSHA-USER-${userId}-${Date.now()}`;
      tokenAccount = await db.create('tokens', {
        userId,
        balance: 0,
        totalRecharged: 0,
        totalSpent: 0,
        qrCode,
      });
    }

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(tokenAccount.qrCode);

    res.json({
      tokenAccount,
      qrCodeImage: qrCodeDataURL,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get user token balance
export const getTokenBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const tokenAccount = await db.findOne('tokens', { userId });
    
    if (!tokenAccount) {
      res.status(404).json({ message: 'Token account not found', balance: 0 });
      return;
    }

    res.json({ balance: tokenAccount.balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Recharge tokens for user (scan QR or select user)
export const rechargeTokens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { userId, qrCode, tokens, amount, description } = req.body;

    if (!tokens || tokens <= 0) {
      res.status(400).json({ message: 'Invalid token amount' });
      return;
    }

    // Find user by ID or QR code
    let tokenAccount;
    if (qrCode) {
      tokenAccount = await db.findOne('tokens', { qrCode });
    } else if (userId) {
      tokenAccount = await db.findOne('tokens', { userId });
    }

    if (!tokenAccount) {
      res.status(404).json({ message: 'User token account not found' });
      return;
    }

    // Update balance
    const oldBalance = tokenAccount.balance;
    const newBalance = tokenAccount.balance + tokens;
    await db.updateOne('tokens', { _id: tokenAccount._id }, {
      balance: newBalance,
      totalRecharged: tokenAccount.totalRecharged + tokens,
    });

    // Create transaction record
    const transaction = await db.create('transactions', {
      userId: tokenAccount.userId,
      stallId: null,
      type: 'recharge',
      amount: amount || 0,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      status: 'completed',
      description: description || `Token recharge by admin`,
      metadata: {
        adminId,
        tokens,
        completedAt: new Date(),
      },
    });

    // Send WebSocket notifications
    wsService.notifyBalanceUpdate(tokenAccount.userId, newBalance);
    wsService.notifyTransaction(tokenAccount.userId, {
      ...transaction,
      tokens,
      type: 'recharge',
    });

    res.json({
      message: 'Tokens recharged successfully',
      newBalance,
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get user transaction history
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = 50, type } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let transactions = await db.find('transactions', { userId });
    
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    transactions = transactions.slice(0, Number(limit));

    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all transactions with filters
export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, stallId, type, status, startDate, endDate } = req.query;

    let transactions = await db.find('transactions', {});

    if (userId) transactions = transactions.filter(t => t.userId === userId);
    if (stallId) transactions = transactions.filter(t => t.stallId === stallId);
    if (type) transactions = transactions.filter(t => t.type === type);
    if (status) transactions = transactions.filter(t => t.status === status);
    
    if (startDate) {
      transactions = transactions.filter(t => 
        new Date(t.createdAt) >= new Date(startDate as string)
      );
    }
    if (endDate) {
      transactions = transactions.filter(t => 
        new Date(t.createdAt) <= new Date(endDate as string)
      );
    }

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ transactions, count: transactions.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Shopkeeper: Initiate payment transaction
export const initiatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopkeeperId = req.user?.id;
    const { qrCode, tokens, description, isGamingStall } = req.body;

    if (!qrCode || !tokens || tokens <= 0) {
      res.status(400).json({ message: 'Invalid payment details' });
      return;
    }

    // Find user by QR code
    const tokenAccount = await db.findOne('tokens', { qrCode });
    if (!tokenAccount) {
      res.status(404).json({ message: 'Invalid QR code' });
      return;
    }

    // Check balance
    if (tokenAccount.balance < tokens) {
      res.status(400).json({ message: 'Insufficient token balance', currentBalance: tokenAccount.balance });
      return;
    }

    // Get shopkeeper's stall
    const shopkeeper = await db.findById('users', shopkeeperId!);
    if (!shopkeeper || !shopkeeper.stallId) {
      res.status(403).json({ message: 'Shopkeeper not assigned to any stall' });
      return;
    }

    // Create pending transaction
    const oldBalance = tokenAccount.balance;
    const transaction = await db.create('transactions', {
      userId: tokenAccount.userId,
      stallId: shopkeeper.stallId,
      type: 'purchase',
      amount: 0,
      balanceBefore: oldBalance,
      balanceAfter: oldBalance - tokens,
      status: 'pending',
      description: description || 'Stall payment',
      metadata: {
        shopkeeperId,
        tokens,
        qrCodeScanned: qrCode,
        gameScore: isGamingStall ? 0 : undefined,
      },
    });

    res.json({
      message: 'Payment initiated. Awaiting confirmation.',
      transaction,
      userBalance: tokenAccount.balance,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Shopkeeper: Complete/Accept payment transaction
export const completePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopkeeperId = req.user?.id;
    const { transactionId, gameScore } = req.body;

    const transaction = await db.findById('transactions', transactionId);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (transaction.shopkeeperId !== shopkeeperId) {
      res.status(403).json({ message: 'Unauthorized to complete this transaction' });
      return;
    }

    if (transaction.status !== 'pending') {
      res.status(400).json({ message: 'Transaction is not pending' });
      return;
    }

    // Deduct tokens from user
    const tokenAccount = await db.findOne('tokens', { userId: transaction.userId });
    if (!tokenAccount) {
      res.status(404).json({ message: 'Token account not found' });
      return;
    }

    const newBalance = tokenAccount.balance - transaction.tokensUsed;
    await db.updateOne('tokens', { _id: tokenAccount._id }, {
      balance: newBalance,
      totalSpent: tokenAccount.totalSpent + transaction.tokensUsed,
    });

    // Update transaction
    await db.update('transactions', transactionId, {
      status: 'completed',
      completedAt: new Date(),
      gameScore: gameScore !== undefined ? gameScore : transaction.gameScore,
    });

    // Create stall visit record
    await db.create('stallvisits', {
      userId: transaction.userId,
      stallId: transaction.stallId,
      transactionId,
      tokensSpent: transaction.tokensUsed,
      gameScore: gameScore !== undefined ? gameScore : transaction.gameScore,
      visitedAt: new Date(),
    });

    // If gaming stall, add score to user's points
    if (gameScore !== undefined && gameScore > 0) {
      await db.create('points', {
        userId: transaction.userId,
        stallId: transaction.stallId,
        points: gameScore,
        source: 'game',
        description: `Game score from ${transaction.description}`,
      });
    }

    // Send WebSocket notifications
    wsService.notifyBalanceUpdate(transaction.userId, newBalance);
    wsService.notifyTransaction(transaction.userId, {
      ...transaction,
      status: 'completed',
      completedAt: new Date(),
      gameScore,
    });

    res.json({
      message: 'Payment completed successfully',
      newBalance,
      gameScore,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Shopkeeper: Decline payment transaction
export const declinePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopkeeperId = req.user?.id;
    const { transactionId, reason } = req.body;

    const transaction = await db.findById('transactions', transactionId);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (transaction.shopkeeperId !== shopkeeperId) {
      res.status(403).json({ message: 'Unauthorized to decline this transaction' });
      return;
    }

    if (transaction.status !== 'pending') {
      res.status(400).json({ message: 'Transaction is not pending' });
      return;
    }

    // Update transaction status
    await db.update('transactions', transactionId, {
      status: 'declined',
      description: `${transaction.description} - Declined: ${reason || 'No reason provided'}`,
      completedAt: new Date(),
    });

    res.json({ message: 'Payment declined' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending transactions for shopkeeper
export const getPendingTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shopkeeperId = req.user?.id;

    const shopkeeper = await db.findById('users', shopkeeperId!);
    if (!shopkeeper || !shopkeeper.stallId) {
      res.status(403).json({ message: 'Shopkeeper not assigned to any stall' });
      return;
    }

    const transactions = await db.find('transactions', {
      stallId: shopkeeper.stallId,
      status: 'pending',
    });

    // Enrich with user data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (t) => {
        const user = await db.findById('users', t.userId);
        return {
          ...t,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          } : null,
        };
      })
    );

    res.json({ transactions: enrichedTransactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get stall visit statistics
export const getStallVisitStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stallId } = req.params;

    const visits = await db.find('stallvisits', { stallId });
    const transactions = await db.find('transactions', { stallId, status: 'completed' });

    const totalVisits = visits.length;
    const totalTokensCollected = transactions.reduce((sum, t) => sum + t.tokensUsed, 0);
    const uniqueUsers = new Set(visits.map(v => v.userId)).size;
    
    const totalScore = visits.reduce((sum, v) => sum + (v.gameScore || 0), 0);
    const avgScore = totalVisits > 0 ? totalScore / totalVisits : 0;

    res.json({
      stallId,
      totalVisits,
      totalTokensCollected,
      uniqueUsers,
      totalScore,
      averageScore: avgScore,
      visits,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
