import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, SafeAreaView } from 'react-native';
import { api } from '../services/api';
import AppHeader from '../components/AppHeader';

interface PendingTransaction {
  _id: string;
  tokensUsed: number;
  description?: string;
  gameScore?: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const ShopkeeperScreen: React.FC = () => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isGamingStall, setIsGamingStall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingTransactions();
    const interval = setInterval(loadPendingTransactions, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadPendingTransactions = async () => {
    try {
      const res = await api.get('/tokens/payment/pending');
      setPendingTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Failed to load pending transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleScanQR = async () => {
    if (!qrCodeInput || !tokenAmount) {
      Alert.alert('Error', 'Please enter QR code and token amount');
      return;
    }

    try {
      const res = await api.post('/tokens/payment/initiate', {
        qrCode: qrCodeInput,
        tokens: Number(tokenAmount),
        description: description || 'Stall purchase',
        isGamingStall,
      });

      Alert.alert('Success', res.data.message);
      setQrCodeInput('');
      setTokenAmount('');
      setDescription('');
      loadPendingTransactions();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Payment initiation failed');
    }
  };

  const handleAccept = (transactionId: string, hasScore: boolean) => {
    if (hasScore) {
      Alert.prompt(
        'Enter Game Score',
        'Enter the score achieved by the user:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: (score) => completeTransaction(transactionId, Number(score)),
          },
        ],
        'plain-text',
        '',
        'numeric'
      );
    } else {
      completeTransaction(transactionId);
    }
  };

  const completeTransaction = async (transactionId: string, gameScore?: number) => {
    try {
      const res = await api.post('/tokens/payment/complete', {
        transactionId,
        gameScore,
      });

      Alert.alert('Success', 'Payment completed successfully');
      loadPendingTransactions();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete payment');
    }
  };

  const handleDecline = (transactionId: string) => {
    Alert.prompt(
      'Decline Payment',
      'Reason for declining (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: (reason) => declineTransaction(transactionId, reason),
        },
      ],
      'plain-text'
    );
  };

  const declineTransaction = async (transactionId: string, reason?: string) => {
    try {
      await api.post('/tokens/payment/decline', {
        transactionId,
        reason: reason || 'Declined by shopkeeper',
      });

      Alert.alert('Declined', 'Payment has been declined');
      loadPendingTransactions();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to decline payment');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingTransactions();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Scanner" />
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {/* QR Scanner Section */}
      <View style={styles.scannerCard}>
        <Text style={styles.cardTitle}>🔍 Scan User QR</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Paste or scan QR code"
          value={qrCodeInput}
          onChangeText={setQrCodeInput}
        />

        <TextInput
          style={styles.input}
          placeholder="Token amount"
          value={tokenAmount}
          onChangeText={setTokenAmount}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setIsGamingStall(!isGamingStall)}
        >
          <View style={[styles.checkbox, isGamingStall && styles.checkboxChecked]}>
            {isGamingStall && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>This is a gaming stall (requires score)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleScanQR}
        >
          <Text style={styles.scanButtonText}>Initiate Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Transactions */}
      <View style={styles.pendingCard}>
        <View style={styles.pendingHeader}>
          <Text style={styles.cardTitle}>⏳ Pending Transactions</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingTransactions.length}</Text>
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : pendingTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No pending transactions</Text>
        ) : (
          pendingTransactions.map((t) => (
            <View key={t._id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.userName}>
                  {t.user?.firstName} {t.user?.lastName}
                </Text>
                <Text style={styles.tokenAmount}>{t.tokensUsed} tokens</Text>
              </View>
              
              <Text style={styles.userEmail}>{t.user?.email}</Text>
              {t.description && (
                <Text style={styles.description}>{t.description}</Text>
              )}
              <Text style={styles.timestamp}>
                {new Date(t.createdAt).toLocaleString()}
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={() => handleDecline(t._id)}
                >
                  <Text style={styles.declineButtonText}>❌ Decline</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAccept(t._id, t.gameScore !== undefined)}
                >
                  <Text style={styles.acceptButtonText}>
                    {t.gameScore !== undefined ? '✓ Accept & Score' : '✓ Accept'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📋 Instructions</Text>
        <Text style={styles.instructionText}>
          1. Ask user to show their QR code{'\n'}
          2. Scan or paste the QR code{'\n'}
          3. Enter token amount for the purchase{'\n'}
          4. Click "Initiate Payment"{'\n'}
          5. Accept or decline the pending transaction{'\n'}
          6. For gaming stalls, enter the score when accepting
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scannerCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  scanButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 24,
  },
  transactionCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  tokenAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: '#ede9fe',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5b21b6',
  },
  instructionText: {
    fontSize: 13,
    color: '#6b21a8',
    lineHeight: 20,
  },
});
