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

interface Event {
  _id: string;
  carnivalEventId: string;
  name: string;
  description?: string;
  category: 'game' | 'stage_program';
  type: string;
  adminIds: string[];
  tokenCost: number;
  gameRules?: string;
  participationType: 'individual' | 'group' | 'both';
  qrCode: string;
  location?: string;
  isOpen: boolean;
  totalParticipations: number;
  pendingParticipations: number;
  completedParticipations: number;
}

interface Participant {
  _id: string;
  userName: string;
  userHouse?: string;
  participantName?: string;
  tokensPaid: number;
  pointsAwarded: number;
  status: 'pending' | 'completed';
  participatedAt: string;
}

const MyEventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [awardPoints, setAwardPoints] = useState('');
  const [awardNotes, setAwardNotes] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/carnival-stalls/my-stalls');
      setEvents(response.data.stalls || []);
    } catch (error: any) {
      console.error('Load events error:', error);
      Alert.alert('Error', 'Failed to load your events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const viewQRCode = (event: Event) => {
    setSelectedEvent(event);
    setShowQRModal(true);
  };

  const viewParticipants = async (event: Event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);

    try {
      const response = await api.get(`/carnival-stalls/${event._id}/participants`);
      setParticipants(response.data.participants || []);
    } catch (error: any) {
      console.error('Load participants error:', error);
      Alert.alert('Error', 'Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const openAwardModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setAwardPoints('');
    setAwardNotes('');
    setShowAwardModal(true);
  };

  const handleAwardPoints = async () => {
    if (!selectedParticipant || !awardPoints) {
      Alert.alert('Error', 'Please enter points to award');
      return;
    }

    const points = parseInt(awardPoints);
    if (points <= 0) {
      Alert.alert('Error', 'Points must be greater than 0');
      return;
    }

    try {
      await api.patch(`/carnival-stalls/participation/${selectedParticipant._id}/award`, {
        points,
        notes: awardNotes || undefined,
      });

      Alert.alert('Success', `Awarded ${points} points successfully!`);
      setShowAwardModal(false);
      setSelectedParticipant(null);
      
      if (selectedEvent) {
        viewParticipants(selectedEvent);
      }
      
      loadEvents();
    } catch (error: any) {
      console.error('Award points error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to award points');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <Text style={styles.headerSubtitle}>Events you're volunteering for</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Events Assigned</Text>
            <Text style={styles.emptyText}>
              You haven't been assigned as a volunteer for any events yet
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event._id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventHeaderLeft}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: event.category === 'game' ? colors.blue : colors.purple }
                  ]}>
                    <Text style={styles.categoryBadgeText}>
                      {event.category === 'game' ? '🎮 Game' : '🎭 Stage'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: event.isOpen ? colors.success : colors.gray[400] }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {event.isOpen ? 'OPEN' : 'CLOSED'}
                  </Text>
                </View>
              </View>

              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}

              <View style={styles.eventInfo}>
                {event.category === 'game' ? (
                  <Text style={styles.eventInfoText}>💰 {event.tokenCost} tokens</Text>
                ) : (
                  <Text style={styles.eventInfoText}>🎟️ Free Entry</Text>
                )}
                {event.location && <Text style={styles.eventInfoText}>📍 {event.location}</Text>}
                <Text style={styles.eventInfoText}>
                  👥 {event.participationType} participation
                </Text>
              </View>

              {event.gameRules && (
                <View style={styles.rulesBox}>
                  <Text style={styles.rulesTitle}>Rules:</Text>
                  <Text style={styles.rulesText}>{event.gameRules}</Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{event.totalParticipations}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.warning }]}>
                    {event.pendingParticipations}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {event.completedParticipations}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>

              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.qrButton]}
                  onPress={() => viewQRCode(event)}
                >
                  <Text style={styles.actionButtonText}>📱 QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.participantsButton]}
                  onPress={() => viewParticipants(event)}
                >
                  <Text style={styles.actionButtonText}>👥 Participants</Text>
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
            <Text style={styles.modalTitle}>{selectedEvent?.name}</Text>
            <Text style={styles.qrSubtitle}>Show this QR code to participants</Text>
            <View style={styles.qrContainer}>
              {selectedEvent && (
                <QRCode value={selectedEvent.qrCode} size={250} />
              )}
            </View>
            <Text style={styles.qrCodeText}>{selectedEvent?.qrCode}</Text>
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
            <Text style={styles.modalTitle}>Participants - {selectedEvent?.name}</Text>
            {loadingParticipants ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
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
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowParticipantsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Award Points Modal */}
      <Modal visible={showAwardModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.awardModalContent}>
            <Text style={styles.modalTitle}>Award Points</Text>
            <Text style={styles.awardSubtitle}>
              {selectedParticipant?.participantName || selectedParticipant?.userName}
            </Text>

            <Text style={styles.label}>Points *</Text>
            <TextInput
              style={styles.input}
              value={awardPoints}
              onChangeText={setAwardPoints}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.purple,
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  eventDescription: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
  eventInfo: {
    marginBottom: 12,
    gap: 4,
  },
  eventInfoText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rulesBox: {
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 12,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 4,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButton: {
    backgroundColor: colors.purple,
  },
  participantsButton: {
    backgroundColor: colors.blue,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
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
  qrModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '90%',
  },
  awardModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
    textAlign: 'center',
  },
  awardSubtitle: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 20,
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
    backgroundColor: colors.white,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  awardButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MyEventsScreen;
