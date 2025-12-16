import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';

interface PaymentFeedbackModalProps {
  visible: boolean;
  success: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  details?: {
    stallName?: string;
    tokensCost?: number;
    remainingBalance?: number;
    transactionId?: string;
  };
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  green: '#10B981',
  red: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    700: '#374151',
  },
};

const PaymentFeedbackModal: React.FC<PaymentFeedbackModalProps> = ({
  visible,
  success,
  title,
  message,
  onClose,
  details,
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, success ? styles.successBg : styles.errorBg]}>
            <Text style={styles.iconText}>{success ? '✓' : '✕'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {title || (success ? 'Payment Successful!' : 'Payment Failed')}
          </Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Details */}
          {details && success && (
            <View style={styles.detailsContainer}>
              {details.stallName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Event:</Text>
                  <Text style={styles.detailValue}>{details.stallName}</Text>
                </View>
              )}
              {details.tokensCost !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tokens Used:</Text>
                  <Text style={[styles.detailValue, styles.tokenCost]}>
                    {details.tokensCost} 🎟️
                  </Text>
                </View>
              )}
              {details.remainingBalance !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining Balance:</Text>
                  <Text style={[styles.detailValue, styles.balance]}>
                    {details.remainingBalance} 🎟️
                  </Text>
                </View>
              )}
              {details.transactionId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={[styles.detailValue, styles.transactionId]}>
                    {details.transactionId.slice(-8)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.button, success ? styles.successButton : styles.errorButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {success ? 'Continue' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successBg: {
    backgroundColor: colors.green,
  },
  errorBg: {
    backgroundColor: colors.red,
  },
  iconText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray[500],
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
    flex: 1,
    textAlign: 'right',
  },
  tokenCost: {
    color: colors.red,
  },
  balance: {
    color: colors.green,
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  successButton: {
    backgroundColor: colors.green,
  },
  errorButton: {
    backgroundColor: colors.red,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
});

export default PaymentFeedbackModal;
