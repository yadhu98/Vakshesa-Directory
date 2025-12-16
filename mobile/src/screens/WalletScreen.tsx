import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { api } from '../services/api';

interface TokenAccount {
  balance: number;
  totalRecharged: number;
  totalSpent: number;
  qrCode: string;
}

interface Transaction {
  _id: string;
  type: 'recharge' | 'payment' | 'refund';
  tokensUsed: number;
  status: string;
  description?: string;
  gameScore?: number;
  createdAt: string;
}

export const WalletScreen: React.FC = () => {
  const [tokenAccount, setTokenAccount] = useState<TokenAccount | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      // Get QR code and balance
      const qrRes = await api.get('/tokens/qrcode');
      setTokenAccount(qrRes.data.tokenAccount);
      setQrCodeImage(qrRes.data.qrCodeImage);

      // Get transaction history
      const historyRes = await api.get('/tokens/history', { params: { limit: 20 } });
      setTransactions(historyRes.data.transactions || []);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'declined': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recharge': return '⬆️';
      case 'payment': return '⬇️';
      case 'refund': return '↩️';
      default: return '•';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{tokenAccount?.balance || 0}</Text>
        <Text style={styles.balanceSubtext}>tokens</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Recharged</Text>
            <Text style={styles.statValue}>{tokenAccount?.totalRecharged || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>{tokenAccount?.totalSpent || 0}</Text>
          </View>
        </View>
      </View>

      {/* QR Code */}
      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Your QR Code</Text>
        <Text style={styles.qrSubtext}>Show this to admin for recharge or shopkeeper for payment</Text>
        {qrCodeImage ? (
          <Image 
            source={{ uri: qrCodeImage }} 
            style={styles.qrImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text>QR Code</Text>
          </View>
        )}
        <Text style={styles.qrCode}>{tokenAccount?.qrCode}</Text>
      </View>

      {/* Recharge Notice */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeText}>
          💡 Visit the admin desk to recharge your tokens
        </Text>
      </View>

      {/* Transaction History */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map((t) => (
            <View key={t._id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>{getTypeIcon(t.type)}</Text>
                <View>
                  <Text style={styles.transactionDesc}>{t.description || t.type}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(t.createdAt).toLocaleString()}
                  </Text>
                  {t.gameScore !== undefined && (
                    <Text style={styles.transactionScore}>Score: {t.gameScore}</Text>
                  )}
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  { color: t.type === 'recharge' ? '#10b981' : '#ef4444' }
                ]}>
                  {t.type === 'recharge' ? '+' : '-'}{t.tokensUsed}
                </Text>
                <Text style={[styles.transactionStatus, { color: getStatusColor(t.status) }]}>
                  {t.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6b7280',
  },
  balanceCard: {
    backgroundColor: '#667eea',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#e0e7ff',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  balanceSubtext: {
    color: '#e0e7ff',
    fontSize: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#e0e7ff',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginVertical: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  qrCode: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  noticeCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noticeText: {
    color: '#92400e',
    textAlign: 'center',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  transactionScore: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
