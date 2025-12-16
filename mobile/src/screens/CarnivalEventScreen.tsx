import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import AppHeader from '../components/AppHeader';
import { useWebSocket } from '../utils/useWebSocket';
import StallDetailsModal from '../components/StallDetailsModal';
import PaymentFeedbackModal from '../components/PaymentFeedbackModal';
import StageProgramRegistrationModal from '../components/StageProgramRegistrationModal';

// Conditionally import BarCodeScanner only on native platforms
let BarCodeScanner: any = null;
if (Platform.OS !== 'web') {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
}

// Color theme - matching directory design
const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  purple: '#F3E8FF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
  },
};

interface Transaction {
  _id: string;
  type: string;
  tokensUsed: number;
  status: string;
  createdAt: string;
  stallName?: string;
}

interface LeaderboardEntry {
  _id?: string;
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  profilePicture?: string;
}

const CarnivalEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'wallet' | 'leaderboard' | 'scan'>('wallet');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [eventActive, setEventActive] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [checkingEvent, setCheckingEvent] = useState(true);
  const [manualQrInput, setManualQrInput] = useState('');
  
  // Stall details modal state
  const [showStallModal, setShowStallModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [stallModalLoading, setStallModalLoading] = useState(false);
  const [pendingCode, setPendingCode] = useState<{ qrCode: string | null; shortCode: string | null } | null>(null);

  // Payment feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState<any>(null);

  // Stage program registration modal state
  const [showStageRegistrationModal, setShowStageRegistrationModal] = useState(false);

  // WebSocket connection for live updates
  const { isConnected: wsConnected } = useWebSocket({
    onBalance: (balance: number) => {
      console.log('📊 Balance update received:', balance);
      setTokenBalance(balance);
    },
    onTransaction: (transaction: any) => {
      console.log('💸 Transaction update received:', transaction);
      // Reload transaction history
      loadTransactionHistory();
    },
    onLeaderboard: (leaderboard: any[]) => {
      console.log('🏆 Leaderboard update received');
      setLeaderboard(leaderboard);
    },
    autoReconnect: true,
  });

  useEffect(() => {
    checkEventStatus();
  }, []);

  useEffect(() => {
    if (eventActive) {
      loadData();
    }
  }, [eventActive]);

  useEffect(() => {
    if (activeTab === 'scan' && Platform.OS !== 'web') {
      requestCameraPermission();
    }
  }, [activeTab]);

  const checkEventStatus = async () => {
    try {
      const res = await api.get('/events/active');
      const activeEvent = res.data.data.event;
      
      if (activeEvent) {
        setEventActive(true);
        setEventData(activeEvent);
      } else {
        setEventActive(false);
        setEventData(null);
      }
    } catch (error) {
      console.error('Failed to check event status:', error);
      setEventActive(false);
    } finally {
      setCheckingEvent(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web' || !BarCodeScanner) {
      setHasPermission(true); // Web doesn't need camera permission for manual input
      return;
    }
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadData = async () => {
    try {
      const [qrRes, balanceRes, historyRes, leaderboardRes] = await Promise.all([
        api.get('/tokens/qrcode'),
        api.get('/tokens/balance'),
        api.get('/tokens/history'),
        api.get('/users/leaderboard'),
      ]);

      setQrCodeImage(qrRes.data.qrCodeImage || '');
      setTokenBalance(balanceRes.data.balance || 0);
      setTransactions(historyRes.data.transactions || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load carnival data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const historyRes = await api.get('/tokens/history');
      setTransactions(historyRes.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  };

  const handleStallModalClose = () => {
    setShowStallModal(false);
    setSelectedStall(null);
    setPendingCode(null);
    setStallModalLoading(false);
  };

  const handleStallModalConfirm = async () => {
    if (!pendingCode || !selectedStall) return;

    // Check if this is a stage program - show registration modal
    const isStageProgram = selectedStall.category === 'stage_program';
    console.log('🎭 handleStallModalConfirm - isStageProgram:', isStageProgram, 'category:', selectedStall.category);
    
    if (isStageProgram) {
      console.log('🎭 Opening stage registration modal...');
      setShowStallModal(false);
      setShowStageRegistrationModal(true);
      return;
    }

    // For regular stalls, proceed with immediate participation
    setStallModalLoading(true);
    
    try {
      const payload = pendingCode.qrCode 
        ? { qrCode: pendingCode.qrCode } 
        : { shortCode: pendingCode.shortCode };
      
      const res = await api.post('/carnival-stalls/participate', payload);

      handleStallModalClose();

      // Show success feedback
      setFeedbackSuccess(true);
      setFeedbackMessage(`You've successfully joined ${selectedStall?.name}! Enjoy the event!`);
      setFeedbackDetails({
        stallName: selectedStall?.name,
        tokensCost: selectedStall?.tokenCost,
        remainingBalance: res.data.remainingTokens,
        transactionId: res.data.participation?._id || res.data._id,
      });
      setShowFeedbackModal(true);

      loadData();
    } catch (error: any) {
      setStallModalLoading(false);
      handleStallModalClose();
      
      // Show error feedback
      const errorMsg = error.response?.data?.message || 'Failed to participate';
      setFeedbackSuccess(false);
      setFeedbackMessage(errorMsg);
      setFeedbackDetails(null);
      setShowFeedbackModal(true);
    }
  };

  const handleStageRegistrationSubmit = async (registrationData: any) => {
    console.log('🎭 handleStageRegistrationSubmit called with data:', registrationData);
    
    if (!pendingCode || !selectedStall) {
      console.log('❌ Missing pendingCode or selectedStall');
      return;
    }

    setStallModalLoading(true);
    
    try {
      const payload = {
        ...(pendingCode.qrCode ? { qrCode: pendingCode.qrCode } : { shortCode: pendingCode.shortCode }),
        isStageProgram: true,
        participantName: registrationData.participantName,
        performanceDetails: registrationData.performanceDetails,
        performance: registrationData.performanceDetails, // Backend expects 'performance' field
        numberOfParticipants: registrationData.numberOfParticipants,
        groupMembers: registrationData.groupMembers,
      };
      
      console.log('🎭 Submitting stage registration:', payload);
      const res = await api.post('/carnival-stalls/participate', payload);
      console.log('✅ Registration successful:', res.data);

      setShowStageRegistrationModal(false);
      handleStallModalClose();

      // Show success feedback
      setFeedbackSuccess(true);
      setFeedbackMessage(`You've successfully registered for ${selectedStall?.name}! Break a leg!`);
      setFeedbackDetails({
        stallName: selectedStall?.name,
        tokensCost: selectedStall?.tokenCost,
        remainingBalance: res.data.remainingTokens,
        transactionId: res.data.participation?._id || res.data._id,
      });
      setShowFeedbackModal(true);

      loadData();
    } catch (error: any) {
      setStallModalLoading(false);
      setShowStageRegistrationModal(false);
      handleStallModalClose();
      
      // Show error feedback
      const errorMsg = error.response?.data?.message || 'Failed to register';
      setFeedbackSuccess(false);
      setFeedbackMessage(errorMsg);
      setFeedbackDetails(null);
      setShowFeedbackModal(true);
    }
  };

  const handleStageRegistrationClose = () => {
    setShowStageRegistrationModal(false);
    // Optionally reopen stall modal or clear everything
    // setShowStallModal(true); // Uncomment if you want to go back to stall modal
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    await processQRCode(data);
  };

  const handleManualQRSubmit = async () => {
    if (!manualQrInput.trim()) {
      Alert.alert('Error', 'Please enter a code');
      return;
    }
    
    const input = manualQrInput.trim().toUpperCase();
    
    // If it's a short alphanumeric code (3-10 chars), treat as shortCode
    // Otherwise treat as full QR code string
    if (input.length >= 3 && input.length <= 10 && /^[A-Z0-9]+$/.test(input)) {
      await processCode(null, input);
    } else {
      await processCode(input, null);
    }
    
    setManualQrInput('');
  };

  const processQRCode = async (data: string) => {
    await processCode(data, null);
  };

  const processCode = async (qrCode: string | null, shortCode: string | null) => {
    try {
      // Check if it's a carnival stall code
      const code = qrCode || shortCode;
      if (!code) return;
      
      // All codes go through carnival stalls flow
      // Short codes (3 chars) or QR codes starting with STALL_/EVENT_
      if (shortCode || qrCode?.startsWith('STALL_') || qrCode?.startsWith('EVENT_')) {
        // Get stall details and show modal
        const endpoint = qrCode 
          ? `/carnival-stalls/qr/${qrCode}`
          : `/carnival-stalls/code/${shortCode}`;
        
        try {
          const stallRes = await api.get(endpoint);
          const stall = stallRes.data.stall;
          
          setSelectedStall(stall);
          setPendingCode({ qrCode, shortCode });
          setShowStallModal(true);
          setActiveTab('wallet');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to load stall details';
          Alert.alert('Error', errorMsg);
        }
      } else {
        // For any other QR codes, show not supported message
        Alert.alert(
          'Not Supported',
          'This QR code is not recognized. Please scan a carnival event QR code or enter a 3-character event code.'
        );
        setActiveTab('wallet');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to scan QR code';
      Alert.alert('Error', errorMsg);
      setActiveTab('wallet');
    }
  };

  if (checkingEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Checking event status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🎪</Text>
          <Text style={styles.emptyTitle}>No Active Carnival Event</Text>
          <Text style={styles.emptyText}>Phase 2 is currently disabled.</Text>
          <Text style={styles.emptySubtext}>Check back later when the carnival event is active!</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={checkEventStatus}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading carnival data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader title={`🎪 ${eventData?.name || 'Carnival'}`} showBack={true} />
      
      {/* Quick Actions Bar */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity
          style={styles.myStallsButton}
          onPress={() => (navigation as any).navigate('MyStalls')}
        >
          <Text style={styles.myStallsButtonText}>🏪 My Stalls</Text>
        </TouchableOpacity>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Tokens</Text>
            {wsConnected && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.balanceValue}>{tokenBalance} 🎟️</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wallet' && styles.activeTab]}
          onPress={() => setActiveTab('wallet')}
        >
          <Text style={[styles.tabText, activeTab === 'wallet' && styles.activeTabText]}>
            💳 Wallet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
          onPress={() => setActiveTab('scan')}
        >
          <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>
            📷 Scan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            🏆 Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'wallet' && (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* QR Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your QR Code</Text>
            <Text style={styles.sectionSubtitle}>
              Show this to shopkeepers for token recharge
            </Text>
            {qrCodeImage ? (
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: qrCodeImage }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Code not available</Text>
              </View>
            )}
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : (
              transactions.slice(0, 10).map((txn) => (
                <View key={txn._id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionType}>
                      {txn.type === 'recharge' ? '➕ Recharge' : '➖ Payment'}
                    </Text>
                    {txn.stallName && (
                      <Text style={styles.transactionStall}>{txn.stallName}</Text>
                    )}
                    <Text style={styles.transactionDate}>
                      {new Date(txn.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        txn.type === 'recharge' ? styles.positiveAmount : styles.negativeAmount,
                      ]}
                    >
                      {txn.type === 'recharge' ? '+' : '-'}{txn.tokensUsed}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        txn.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>{txn.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'scan' && (
        <View style={styles.content}>
          {Platform.OS === 'web' ? (
            // Manual QR Input for Web
            <View style={styles.scannerContainer}>
              <Text style={styles.scannerTitle}>Enter QR Code</Text>
              <Text style={styles.scannerSubtitle}>
                Type or paste the stall QR code
              </Text>
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g., STALL_xxxxx"
                  value={manualQrInput}
                  onChangeText={setManualQrInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.submitQRButton}
                  onPress={handleManualQRSubmit}
                >
                  <Text style={styles.submitQRButtonText}>✓ Submit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.permissionText}>
                💡 Camera scanning not available on web. Please enter the QR code manually.
              </Text>
            </View>
          ) : hasPermission === null ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#ff6b6b" />
              <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>❌ Camera permission denied</Text>
              <Text style={styles.permissionText}>
                Please enable camera access in settings to scan QR codes
              </Text>
            </View>
          ) : (
            <View style={styles.scannerContainer}>
              <Text style={styles.scannerTitle}>Scan Shopkeeper QR Code</Text>
              <Text style={styles.scannerSubtitle}>
                Position the QR code within the frame
              </Text>
              {scanning ? (
                BarCodeScanner && (
                  <BarCodeScanner
                    onBarCodeScanned={handleBarCodeScanned}
                    style={styles.scanner}
                  />
                )
              ) : (
                <TouchableOpacity
                  style={styles.startScanButton}
                  onPress={() => setScanning(true)}
                >
                  <Text style={styles.startScanButtonText}>📷 Start Scanning</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {activeTab === 'leaderboard' && (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No leaderboard data yet</Text>
            ) : (
              leaderboard.map((entry, index) => (
                <View
                  key={entry.userId || entry._id}
                  style={[
                    styles.leaderboardCard,
                    index < 3 && styles.topThreeCard,
                  ]}
                >
                  <View style={styles.leaderboardRank}>
                    <Text style={styles.rankText}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank || index + 1}`}
                    </Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{entry.userName}</Text>
                  </View>
                  <View style={styles.leaderboardPoints}>
                    <Text style={styles.pointsValue}>{entry.totalPoints}</Text>
                    <Text style={styles.pointsLabel}>pts</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Stall Details Modal */}
      <StallDetailsModal
        visible={showStallModal}
        stall={selectedStall}
        onClose={handleStallModalClose}
        onConfirm={handleStallModalConfirm}
        loading={stallModalLoading}
        userBalance={tokenBalance}
      />

      {/* Stage Program Registration Modal */}
      <StageProgramRegistrationModal
        visible={showStageRegistrationModal}
        stall={selectedStall}
        onClose={handleStageRegistrationClose}
        onSubmit={handleStageRegistrationSubmit}
        loading={stallModalLoading}
      />

      {/* Payment Feedback Modal */}
      <PaymentFeedbackModal
        visible={showFeedbackModal}
        success={feedbackSuccess}
        message={feedbackMessage}
        details={feedbackDetails}
        onClose={() => {
          setShowFeedbackModal(false);
          if (feedbackSuccess) {
            loadData();
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  refreshButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.purple,
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quickActionsBar: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  myStallsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  myStallsButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    minWidth: 120,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[400],
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignSelf: 'center',
  },
  qrPlaceholderText: {
    color: '#9ca3af',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionStall: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  scannerContainer: {
    flex: 1,
    padding: 20,
  },
  manualInputContainer: {
    marginVertical: 20,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  submitQRButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitQRButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanner: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startScanButton: {
    backgroundColor: '#ff6b6b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  startScanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topThreeCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderboardRank: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  leaderboardFamily: {
    fontSize: 14,
    color: '#6b7280',
  },
  leaderboardPoints: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default CarnivalEventScreen;
