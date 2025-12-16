import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

interface StallDetailsModalProps {
  visible: boolean;
  stall: any;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  userBalance?: number;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  purple: '#F3E8FF',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
  },
};

const StallDetailsModal: React.FC<StallDetailsModalProps> = ({
  visible,
  stall,
  onClose,
  onConfirm,
  loading = false,
  userBalance = 0,
}) => {
  if (!stall) return null;

  const hasEnoughTokens = userBalance >= (stall.tokenCost || 0);
  const isStageProgram = stall.category === 'stage_program';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{stall.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Category Badge */}
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, stall.category === 'game' ? styles.gameBadge : stall.category === 'food' ? styles.foodBadge : stall.category === 'stage_program' ? styles.stage_programBadge : styles.otherBadge]}>
                <Text style={styles.badgeText}>
                  {stall.category === 'game' && '🎮 Game'}
                  {stall.category === 'food' && '🍔 Food'}
                  {stall.category === 'stage_program' && '🎭 Stage Program'}
                  {stall.category === 'other' && '🎪 Other'}
                </Text>
              </View>
            </View>

            {/* Description */}
            {stall.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Description</Text>
                <Text style={styles.descriptionText}>{stall.description}</Text>
              </View>
            )}

            {/* Event Rules */}
            {stall.rules && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Rules</Text>
                <Text style={styles.rulesText}>{stall.rules}</Text>
              </View>
            )}

            {/* Token Cost */}
            {!isStageProgram && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Cost</Text>
                <View style={styles.costContainer}>
                  <Text style={styles.costValue}>{stall.tokenCost} Tokens</Text>
                  <Text style={[
                    styles.balanceText,
                    hasEnoughTokens ? styles.balanceSuccess : styles.balanceError
                  ]}>
                    Your Balance: {userBalance} 🎟️
                  </Text>
                </View>
                {!hasEnoughTokens && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ Insufficient tokens! You need {stall.tokenCost - userBalance} more tokens.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Participants Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Participants</Text>
              <View style={styles.participantsInfo}>
                <Text style={styles.participantsText}>
                  Current: {stall.currentParticipants || 0}
                </Text>
                {stall.maxParticipants && (
                  <Text style={styles.participantsText}>
                    Max: {stall.maxParticipants}
                  </Text>
                )}
              </View>
              {stall.maxParticipants && stall.currentParticipants >= stall.maxParticipants && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    🚫 Event has reached maximum participants
                  </Text>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, stall.isActive ? styles.activeStatus : styles.inactiveStatus]}>
                  <Text style={styles.statusText}>
                    {stall.isActive ? '✅ Active' : '❌ Inactive'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, stall.isOpen ? styles.openStatus : styles.closedStatus]}>
                  <Text style={styles.statusText}>
                    {stall.isOpen ? '🟢 Open' : '🔴 Closed'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Top Winners (if available) */}
            {stall.topWinners && stall.topWinners.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Top Winners</Text>
                {stall.topWinners.map((winner: any, index: number) => (
                  <View key={index} style={styles.winnerItem}>
                    <Text style={styles.winnerRank}>#{index + 1}</Text>
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    <Text style={styles.winnerScore}>{winner.score} pts</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                ((!isStageProgram && !hasEnoughTokens) || !stall.isActive || !stall.isOpen || loading) && styles.disabledButton
              ]}
              onPress={onConfirm}
              disabled={(!isStageProgram && !hasEnoughTokens) || !stall.isActive || !stall.isOpen || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {isStageProgram ? 'Register Now' : `Pay ${stall.tokenCost} Tokens`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray[600],
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gameBadge: {
    backgroundColor: '#DBEAFE',
  },
  foodBadge: {
    backgroundColor: '#FEF3C7',
  },
  stage_programBadge: {
    backgroundColor: '#FCE7F3',
  },
  otherBadge: {
    backgroundColor: colors.gray[100],
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[700],
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
  },
  rulesText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  costContainer: {
    backgroundColor: colors.purple,
    padding: 16,
    borderRadius: 12,
  },
  costValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceSuccess: {
    color: colors.green,
  },
  balanceError: {
    color: colors.red,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.yellow,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
  },
  participantsInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  participantsText: {
    fontSize: 15,
    color: colors.gray[600],
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeStatus: {
    backgroundColor: '#D1FAE5',
  },
  inactiveStatus: {
    backgroundColor: '#FEE2E2',
  },
  openStatus: {
    backgroundColor: '#D1FAE5',
  },
  closedStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  winnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    marginBottom: 8,
  },
  winnerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
  },
  winnerName: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  winnerScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.green,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[700],
    textAlign: 'center',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: colors.gray[300],
  },
});

export default StallDetailsModal;
