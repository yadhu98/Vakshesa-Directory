import { Request, Response } from 'express';
import { db } from '../config/storage';

// Get overall carnival analytics
export const getCarnivalOverview = async (req: Request, res: Response) => {
  try {
    // Get all participations
    const allParticipations = await db.find('stallParticipations', {});
    
    // Get all recharge transactions
    const allRecharges = await db.find('tokenTransactions', { type: 'recharge' });

    // Calculate overall stats
    const totalParticipants = new Set(allParticipations.map((p: any) => p.userId)).size;
    const totalTransactions = allParticipations.length;
    const completedTransactions = allParticipations.filter((p: any) => p.status === 'completed').length;
    const totalTokensExchanged = allParticipations.reduce((sum: number, p: any) => sum + (p.tokensSpent || 0), 0);
    const totalTokensRecharged = allRecharges.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    res.json({
      overview: {
        totalParticipants,
        totalTransactions,
        completedTransactions,
        totalTokensExchanged,
        totalTokensRecharged,
        netTokenFlow: totalTokensRecharged - totalTokensExchanged,
      },
    });
  } catch (error: any) {
    console.error('Get carnival overview error:', error);
    res.status(500).json({ message: 'Failed to fetch carnival overview', error: error.message });
  }
};

// Get stalls ranked by gross revenue
export const getStallsByGross = async (req: Request, res: Response) => {
  try {
    // Get all stalls
    const allStalls = await db.find('carnivalStalls', {});
    
    // Get all participations
    const allParticipations = await db.find('stallParticipations', {});

    // Calculate revenue for each stall
    const stallsWithRevenue = await Promise.all(
      allStalls.map(async (stall: any) => {
        const stallParticipations = allParticipations.filter((p: any) => p.stallId === stall._id.toString());
        const totalRevenue = stallParticipations.reduce((sum: number, p: any) => sum + (p.tokensSpent || 0), 0);
        const participantCount = stallParticipations.length;
        const completedCount = stallParticipations.filter((p: any) => p.status === 'completed').length;

        return {
          stallId: stall._id,
          stallName: stall.name,
          category: stall.category,
          totalRevenue,
          participantCount,
          completedCount,
          averageTokensPerParticipant: participantCount > 0 ? totalRevenue / participantCount : 0,
        };
      })
    );

    // Sort by total revenue (highest first)
    stallsWithRevenue.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    res.json({
      stalls: stallsWithRevenue,
      highestGrossing: stallsWithRevenue[0] || null,
    });
  } catch (error: any) {
    console.error('Get stalls by gross error:', error);
    res.status(500).json({ message: 'Failed to fetch stall gross revenue', error: error.message });
  }
};

// Get transactions grouped by user
export const getTransactionsByUser = async (req: Request, res: Response) => {
  try {
    // Get all participations
    const allParticipations = await db.find('stallParticipations', {});

    // Group by userId
    const userTransactionsMap = new Map();

    for (const participation of allParticipations) {
      const userId = participation.userId;
      if (!userTransactionsMap.has(userId)) {
        userTransactionsMap.set(userId, {
          userId,
          userName: '',
          userEmail: '',
          totalSpent: 0,
          transactionCount: 0,
          transactions: [],
        });
      }

      const userStats = userTransactionsMap.get(userId);
      userStats.totalSpent += participation.tokensSpent || 0;
      userStats.transactionCount += 1;
      userStats.transactions.push({
        stallId: participation.stallId,
        tokensSpent: participation.tokensSpent,
        timestamp: participation.createdAt,
        status: participation.status,
      });
    }

    // Enrich with user details
    const userTransactions = await Promise.all(
      Array.from(userTransactionsMap.values()).map(async (stats: any) => {
        const user = await db.findById('users', stats.userId);
        return {
          ...stats,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email || '',
        };
      })
    );

    // Sort by total spent (highest first)
    userTransactions.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({
      users: userTransactions,
      topSpender: userTransactions[0] || null,
    });
  } catch (error: any) {
    console.error('Get transactions by user error:', error);
    res.status(500).json({ message: 'Failed to fetch user transactions', error: error.message });
  }
};

// Get all recharge transactions (admin-to-user)
export const getRechargeHistory = async (req: Request, res: Response) => {
  try {
    // Get all recharge transactions
    const recharges = await db.find('tokenTransactions', { type: 'recharge' });

    // Enrich with user and admin details
    const enrichedRecharges = await Promise.all(
      recharges.map(async (recharge: any) => {
        const user = await db.findById('users', recharge.userId);
        const admin = recharge.adminId ? await db.findById('users', recharge.adminId) : null;

        return {
          ...recharge,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email,
          adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'System',
          adminEmail: admin?.email,
        };
      })
    );

    // Sort by timestamp (newest first)
    enrichedRecharges.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalRecharged = enrichedRecharges.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    const totalRechargeCount = enrichedRecharges.length;

    res.json({
      summary: {
        totalRecharged,
        totalRechargeCount,
        averageRechargeAmount: totalRechargeCount > 0 ? totalRecharged / totalRechargeCount : 0,
      },
      recharges: enrichedRecharges,
    });
  } catch (error: any) {
    console.error('Get recharge history error:', error);
    res.status(500).json({ message: 'Failed to fetch recharge history', error: error.message });
  }
};

// Get detailed analytics for a specific user
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's participations
    const participations = await db.find('stallParticipations', { userId });

    // Get user's recharges
    const recharges = await db.find('tokenTransactions', { userId, type: 'recharge' });

    // Get user's current token balance
    const tokenAccount = await db.findOne('tokenAccounts', { userId });

    // Calculate stats
    const totalSpent = participations.reduce((sum: number, p: any) => sum + (p.tokensSpent || 0), 0);
    const totalRecharged = recharges.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

    // Enrich participations with stall names
    const enrichedParticipations = await Promise.all(
      participations.map(async (p: any) => {
        const stall = await db.findById('carnivalStalls', p.stallId);
        return {
          ...p,
          stallName: stall?.name || 'Unknown',
          stallCategory: stall?.category,
        };
      })
    );

    res.json({
      user: {
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        currentBalance: tokenAccount?.balance || 0,
      },
      summary: {
        totalSpent,
        totalRecharged,
        participationCount: participations.length,
        rechargeCount: recharges.length,
        netBalance: totalRecharged - totalSpent,
      },
      participations: enrichedParticipations,
      recharges,
    });
  } catch (error: any) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics', error: error.message });
  }
};
