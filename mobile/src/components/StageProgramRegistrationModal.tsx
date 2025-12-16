import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';

interface StageProgramRegistrationModalProps {
  visible: boolean;
  stall: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  purple: '#F3E8FF',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
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

const StageProgramRegistrationModal: React.FC<StageProgramRegistrationModalProps> = ({
  visible,
  stall,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [participantName, setParticipantName] = useState('');
  const [performanceDetails, setPerformanceDetails] = useState('');
  const [numberOfParticipants, setNumberOfParticipants] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debug log when modal becomes visible
  useEffect(() => {
    if (visible) {
      console.log('🎭 StageProgramRegistrationModal opened');
      console.log('🎭 Stall:', stall?.name);
      console.log('🎭 Loading:', loading);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  // Debounced search with 500ms delay
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchLoading(true); // Show loading immediately when typing
      const debounceTimer = setTimeout(() => {
        searchUsers();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setAvailableUsers([]);
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const resetForm = () => {
    setParticipantName('');
    setPerformanceDetails('');
    setNumberOfParticipants('1');
    setSearchQuery('');
    setAvailableUsers([]);
    setSelectedUsers([]);
  };

  const searchUsers = async () => {
    try {
      console.log('🔍 Searching users with query:', searchQuery);
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('🔍 Search response:', response.data);
      console.log('🔍 Results count:', response.data.results?.length || 0);
      
      const results = response.data.results || [];
      console.log('🔍 Setting available users:', results.length, 'users');
      
      if (results.length > 0) {
        console.log('🔍 First result:', results[0]);
      }
      
      // Force update by creating new array
      setAvailableUsers([...results]);
    } catch (error: any) {
      console.error('❌ Failed to search users:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setAvailableUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers.find(u => u._id === user._id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = () => {
    console.log('🎭 handleSubmit called');
    console.log('🎭 participantName:', participantName);
    console.log('🎭 numberOfParticipants:', numberOfParticipants);
    console.log('🎭 selectedUsers:', selectedUsers.length);
    
    if (!participantName.trim()) {
      console.log('❌ Participant name is empty');
      Alert.alert('Error', 'Please enter participant name');
      return;
    }

    const numParticipants = parseInt(numberOfParticipants);
    if (isNaN(numParticipants) || numParticipants < 1) {
      console.log('❌ Invalid number of participants');
      Alert.alert('Error', 'Please enter valid number of participants');
      return;
    }

    // The registrant is always included, so if they select users, 
    // the total should be: 1 (registrant) + selectedUsers.length
    if (selectedUsers.length > 0) {
      const totalParticipants = 1 + selectedUsers.length; // 1 for the registrant
      if (totalParticipants !== numParticipants) {
        console.log('❌ Participant count mismatch. Total:', totalParticipants, 'Expected:', numParticipants);
        Alert.alert(
          'Error', 
          `You've selected ${selectedUsers.length} member(s). Including yourself, that's ${totalParticipants} total. Please select ${numParticipants - 1} member(s) or adjust the count to ${totalParticipants}.`
        );
        return;
      }
    }

    const registrationData = {
      participantName: participantName.trim(),
      performanceDetails: performanceDetails.trim(),
      numberOfParticipants: numParticipants,
      groupMembers: selectedUsers.map(u => u._id),
    };

    console.log('✅ Calling onSubmit with data:', registrationData);
    onSubmit(registrationData);
  };

  if (!stall) return null;

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
            <Text style={styles.modalTitle}>🎭 Register for {stall.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Participant Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Participant/Group Name *</Text>
              <TextInput
                style={styles.input}
                value={participantName}
                onChangeText={setParticipantName}
                placeholder="e.g., John Doe or Team Phoenix"
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Performance Details */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Performance Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={performanceDetails}
                onChangeText={setPerformanceDetails}
                placeholder="Describe your performance, song, dance, etc."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Number of Participants */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Number of Participants *</Text>
              <TextInput
                style={styles.input}
                value={numberOfParticipants}
                onChangeText={setNumberOfParticipants}
                placeholder="e.g., 1, 2, 3..."
                placeholderTextColor={colors.gray[400]}
                keyboardType="number-pad"
              />
            </View>

            {/* Group Members Search */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Add Group Members (Optional)</Text>
              <Text style={styles.helperText}>
                You're already included. Search and select {numberOfParticipants && parseInt(numberOfParticipants) > 1 ? `${parseInt(numberOfParticipants) - 1} additional member(s)` : 'other members'} who are part of your group.
              </Text>
              <TextInput
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.gray[400]}
              />
              
              {searchLoading && (
                <View style={styles.searchLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchLoadingText}>Searching users...</Text>
                </View>
              )}

              {!searchLoading && searchQuery.length >= 2 && availableUsers.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No users found for "{searchQuery}"</Text>
                  <Text style={styles.noResultsHint}>Try a different name or email</Text>
                </View>
              )}

              {availableUsers.length > 0 && (
                <ScrollView style={styles.userList} nestedScrollEnabled>
                  {availableUsers.map(user => {
                    const isSelected = selectedUsers.find(u => u._id === user._id);
                    return (
                      <TouchableOpacity
                        key={user._id}
                        style={[styles.userItem, isSelected && styles.userItemSelected]}
                        onPress={() => toggleUserSelection(user)}
                      >
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Selected Members */}
            {selectedUsers.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Selected Members ({selectedUsers.length})</Text>
                <View style={styles.selectedList}>
                  {selectedUsers.map(user => (
                    <View key={user._id} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <TouchableOpacity onPress={() => toggleUserSelection(user)}>
                        <Text style={styles.removeChip}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Token Cost Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💰 Registration Cost: {stall.tokenCost || 0} tokens
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                console.log('🎭 Cancel button pressed');
                onClose();
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={() => {
                console.log('🎭 Register button pressed!');
                handleSubmit();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Register</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray[600],
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.primary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchLoading: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
    marginBottom: 4,
  },
  noResultsHint: {
    fontSize: 13,
    color: colors.gray[400],
  },
  userList: {
    maxHeight: 200,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.gray[50],
  },
  userItemSelected: {
    backgroundColor: colors.purple,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.gray[500],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedChipText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  removeChip: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: colors.purple,
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  infoText: {
    fontSize: 15,
    color: colors.gray[700],
    fontWeight: '500',
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

export default StageProgramRegistrationModal;
