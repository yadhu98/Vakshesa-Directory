import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from '../components/AppHeader';

// Color theme - matching directory design
const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  purple: '#F3E8FF',
  blue: '#3B82F6',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

interface CarnivalStall {
  _id: string;
  carnivalEventId: string;
  name: string;
  description?: string;
  category: 'game' | 'stage_program';
  type: string;
  adminIds: string[];
  adminNames: string[];
  tokenCost: number;
  gameRules?: string;
  participationType: 'individual' | 'group' | 'both';
  qrCode: string;
  shortCode: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  isOpen: boolean;
  location?: string;
  totalParticipations: number;
  pendingParticipations: number;
  completedParticipations: number;
  createdAt: string;
}

interface Participant {
  _id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userHouse?: string;
  participantName?: string;
  participantDetails?: string;
  performance?: string;
  groupMembers?: string[];
  tokensPaid: number;
  pointsAwarded: number;
  status: 'pending' | 'completed' | 'cancelled';
  participatedAt: string;
  awardedAt?: string;
  notes?: string;
}

const MyStallsScreen: React.FC = () => {
  const [stalls, setStalls] = useState<CarnivalStall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState<CarnivalStall | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [awardPointsInput, setAwardPointsInput] = useState('');
  const [awardNotes, setAwardNotes] = useState('');
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsSummary, setTransactionsSummary] = useState<any>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadStalls();
  }, []);

  const loadStalls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/carnival-stalls/my-stalls');
      setStalls(response.data.stalls || []);
    } catch (error: any) {
      console.error('Load stalls error:', error);
      Alert.alert('Error', 'Failed to load your events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStalls();
  };

  const viewQRCode = (stall: CarnivalStall) => {
    setSelectedStall(stall);
    setShowQRModal(true);
  };

  const viewParticipants = async (stall: CarnivalStall) => {
    setSelectedStall(stall);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);

    try {
      const response = await api.get(`/carnival-stalls/${stall._id}/participants`);
      setParticipants(response.data.participants || []);
    } catch (error: any) {
      console.error('Load participants error:', error);
      Alert.alert('Error', 'Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const viewTransactions = async (stall: CarnivalStall) => {
    setSelectedStall(stall);
    setShowTransactionsModal(true);
    setLoadingTransactions(true);

    try {
      const response = await api.get(`/carnival-stalls/${stall._id}/transactions`);
      setTransactions(response.data.transactions || []);
      setTransactionsSummary(response.data.summary || null);
    } catch (error: any) {
      console.error('Load transactions error:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openAwardModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setAwardPointsInput('');
    setAwardNotes('');
    setShowAwardModal(true);
  };

  const handleAwardPoints = async () => {
    if (!selectedParticipant || !awardPointsInput) {
      Alert.alert('Error', 'Please enter points to award');
      return;
    }

    const points = parseInt(awardPointsInput);
    if (points <= 0) {
      Alert.alert('Error', 'Points must be greater than 0');
      return;
    }

    try {
      const payload: any = { points };
      if (awardNotes) {
        payload.notes = awardNotes;
      }
      
      console.log('Awarding points:', payload);
      const response = await api.patch(`/carnival-stalls/participation/${selectedParticipant._id}/award`, payload);

      Alert.alert('Success', `Awarded ${points} points successfully!`);
      setShowAwardModal(false);
      setSelectedParticipant(null);
      
      // Reload participants
      if (selectedStall) {
        viewParticipants(selectedStall);
      }
      
      // Reload stalls to update counts
      loadStalls();
    } catch (error: any) {
      console.error('Award points error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to award points');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'game': return '#3B82F6';
      case 'activity': return '#10B981';
      case 'show': return '#F59E0B';
      case 'food': return '#EF4444';
      default: return colors.gray[400];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AppHeader title="My Stalls" showBack={true} />

      {/* Stalls List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stalls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Stalls Yet</Text>
            <Text style={styles.emptyText}>
              Create your first stall to start accepting participants
            </Text>
          </View>
        ) : (
          stalls.map((stall) => (
            <View key={stall._id} style={styles.stallCard}>
              <View style={styles.stallHeader}>
                <View style={styles.stallHeaderLeft}>
                  <Text style={styles.stallName}>{stall.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(stall.type) }]}>
                    <Text style={styles.typeBadgeText}>{stall.type.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: stall.isActive ? colors.success : colors.gray[400] }]}>
                  <Text style={styles.statusBadgeText}>{stall.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>

              {stall.description && (
                <Text style={styles.stallDescription}>{stall.description}</Text>
              )}

              <View style={styles.stallInfo}>
                <Text style={styles.stallInfoText}>💰 {stall.tokenCost} tokens</Text>
                {stall.location && <Text style={styles.stallInfoText}>📍 {stall.location}</Text>}
                {stall.maxParticipants && (
                  <Text style={styles.stallInfoText}>
                    👥 {stall.currentParticipants}/{stall.maxParticipants} participants
                  </Text>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stall.totalParticipations || 0}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.warning }]}>
                    {stall.pendingParticipations || 0}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {stall.completedParticipations || 0}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              <View style={styles.stallActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.qrButton]}
                  onPress={() => viewQRCode(stall)}
                >
                  <Text style={styles.actionButtonText}>📱 QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.participantsButton]}
                  onPress={() => viewParticipants(stall)}
                >
                  <Text style={styles.actionButtonText}>👥 Participants</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.transactionsButton]}
                  onPress={() => viewTransactions(stall)}
                >
                  <Text style={styles.actionButtonText}>💳 Revenue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.modalTitle}>{selectedStall?.name}</Text>
            <Text style={styles.qrSubtitle}>Show this QR code to participants</Text>
            <View style={styles.qrContainer}>
              {selectedStall && (
                <QRCode value={selectedStall.qrCode} size={250} />
              )}
            </View>
            <View style={styles.shortCodeContainer}>
              <Text style={styles.shortCodeLabel}>Code:</Text>
              <Text style={styles.shortCodeText}>{selectedStall?.shortCode}</Text>
            </View>
            <Text style={styles.qrCodeHint}>Enter code "{selectedStall?.shortCode}" if QR scan fails</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.submitButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Participants Modal */}
      <Modal visible={showParticipantsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Participants - {selectedStall?.name}</Text>
            {loadingParticipants ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <ScrollView style={styles.participantsList}>
                {participants.length === 0 ? (
                  <Text style={styles.emptyText}>No participants yet</Text>
                ) : (
                  participants.map((p) => (
                    <View key={p._id} style={styles.participantCard}>
                      <View style={styles.participantHeader}>
                        <View>
                          <Text style={styles.participantName}>
                            {p.participantName || p.userName}
                          </Text>
                          {p.userHouse && (
                            <Text style={styles.participantHouse}>{p.userHouse}</Text>
                          )}
                        </View>
                        <View style={[
                          styles.participantStatus,
                          { backgroundColor: p.status === 'completed' ? colors.success : colors.warning }
                        ]}>
                          <Text style={styles.participantStatusText}>
                            {p.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantInfoText}>Tokens: {p.tokensPaid}</Text>
                        <Text style={styles.participantInfoText}>Points: {p.pointsAwarded}</Text>
                      </View>
                      {p.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.awardButton}
                          onPress={() => openAwardModal(p)}
                        >
                          <Text style={styles.awardButtonText}>Award Points</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeOnlyButton}
              onPress={() => setShowParticipantsModal(false)}
            >
              <Text style={styles.closeOnlyButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Award Points Modal */}
      <Modal visible={showAwardModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.modalTitle}>Award Points</Text>
            <Text style={styles.qrSubtitle}>
              {selectedParticipant?.participantName || selectedParticipant?.userName}
            </Text>

            <Text style={styles.label}>Points *</Text>
            <TextInput
              style={styles.input}
              value={awardPointsInput}
              onChangeText={setAwardPointsInput}
              placeholder="Enter points (e.g., 10)"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={awardNotes}
              onChangeText={setAwardNotes}
              placeholder="Add any notes..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAwardModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAwardPoints}
              >
                <Text style={styles.submitButtonText}>Award</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transactions Modal */}
      <Modal visible={showTransactionsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Revenue - {selectedStall?.name}</Text>
            
            {loadingTransactions ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                {transactionsSummary && (
                  <View style={styles.revenueSummary}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryValue}>🪙 {transactionsSummary.totalRevenue}</Text>
                      <Text style={styles.summaryLabel}>Total Tokens Collected</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemValue}>{transactionsSummary.totalParticipants}</Text>
                        <Text style={styles.summaryItemLabel}>Total Participants</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemValue}>{transactionsSummary.completedTransactions}</Text>
                        <Text style={styles.summaryItemLabel}>Completed</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemValue}>{Math.round(transactionsSummary.averageTokensPerParticipant)}</Text>
                        <Text style={styles.summaryItemLabel}>Avg Tokens</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                <ScrollView style={styles.transactionsList}>
                  {transactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions yet</Text>
                  ) : (
                    transactions.map((t) => (
                      <View key={t._id} style={styles.transactionCard}>
                        <View style={styles.transactionHeader}>
                          <Text style={styles.transactionName}>{t.userName}</Text>
                          <Text style={styles.transactionAmount}>🪙 {t.tokensSpent}</Text>
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={styles.transactionEmail}>{t.userEmail}</Text>
                          <View style={[
                            styles.transactionStatus,
                            { backgroundColor: t.status === 'completed' ? colors.success : colors.warning }
                          ]}>
                            <Text style={styles.transactionStatusText}>
                              {t.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.transactionDate}>
                          {new Date(t.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            )}
            
            <TouchableOpacity
              style={styles.closeOnlyButton}
              onPress={() => setShowTransactionsModal(false)}
            >
              <Text style={styles.closeOnlyButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  stallCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stallHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stallName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  stallDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
  stallInfo: {
    marginBottom: 12,
    gap: 4,
  },
  stallInfoText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  stallActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  qrButton: {
    backgroundColor: colors.purple,
  },
  participantsButton: {
    backgroundColor: colors.gray[100],
  },
  toggleButton: {
    backgroundColor: colors.gray[100],
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: colors.gray[500],
    textTransform: 'capitalize',
  },
  typeOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  cancelButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  closeOnlyButton: {
    width: '100%',
    height: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[200],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  closeOnlyButtonText: {
    color: colors.gray[500],
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  qrModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '90%',
  },
  qrSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
  },
  shortCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shortCodeLabel: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  shortCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
  },
  qrCodeHint: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  qrCodeText: {
    fontSize: 11,
    color: colors.gray[400],
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  participantsList: {
    flex: 1,
    marginBottom: 16,
  },
  participantCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  participantHouse: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  participantStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  participantStatusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  participantInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  participantInfoText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  awardButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  awardButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  transactionsButton: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  transactionsList: {
    flex: 1,
    marginBottom: 16,
  },
  revenueSummary: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.purple,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
  },
  transactionCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionEmail: {
    fontSize: 13,
    color: colors.gray[500],
    flex: 1,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transactionStatusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: colors.gray[400],
  },
});

export default MyStallsScreen;
