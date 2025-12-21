import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

type House = 'All' | 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  house?: House;
  profilePicture?: string;
  address?: string;
  profession?: string;
  gender?: string;
  generation?: number;
  role?: string;
}

// Shared theme colors
const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
    medium: '#999999',
    dark: '#666666',
  },
};

const DirectoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const houses: House[] = ['All', 'Kadannamanna', 'Mankada', 'Ayiranazhi', 'Aripra'];

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, selectedHouse, members]);

  const loadMembers = async () => {
    try {
      const response = await api.get('/bulk/users');
      const users = response.data.users || [];
      setMembers(users);
      setFilteredMembers(users);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by house
    if (selectedHouse !== 'All') {
      filtered = filtered.filter(m => m.house === selectedHouse);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const renderHouseChip = (house: House) => {
    const isSelected = selectedHouse === house;
    return (
      <TouchableOpacity
        key={house}
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
        ]}
        onPress={() => setSelectedHouse(house)}
      >
        <Text style={[
          styles.chipText,
          isSelected && styles.chipTextSelected,
        ]}>
          {house}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMember = ({ item }: { item: Member }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const contactInfo = item.phone || item.email;

    return (
      <TouchableOpacity 
        style={styles.memberCard}
        onPress={() => handleMemberPress(item)}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {getInitials(item.firstName, item.lastName)}
            </Text>
          )}
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{fullName}</Text>
          <Text style={styles.memberContact}>{contactInfo}</Text>
          {item.house && (
            <Text style={styles.memberHouse}>{item.house}</Text>
          )}
        </View>

        <Feather name="chevron-right" size={24} color={colors.gray.medium} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <AppHeader title="Directory" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={colors.gray.medium} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor={colors.gray.medium}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* House Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {houses.map(renderHouseChip)}
      </ScrollView>

      {/* Member List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Select to contact</Text>
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          }
        />
      </View>

      {/* Member Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.gray.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedMember && (
                <>
                  {/* Avatar & Name */}
                  <View style={styles.modalAvatarSection}>
                    <View style={styles.modalAvatar}>
                      {selectedMember.profilePicture ? (
                        <Image 
                          source={{ uri: selectedMember.profilePicture }} 
                          style={styles.modalAvatarImage} 
                        />
                      ) : (
                        <Text style={styles.modalAvatarText}>
                          {getInitials(selectedMember.firstName, selectedMember.lastName)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.modalName}>
                      {selectedMember.firstName} {selectedMember.lastName}
                    </Text>
                    {selectedMember.profession && (
                      <Text style={styles.modalProfession}>{selectedMember.profession}</Text>
                    )}
                  </View>

                  {/* Details */}
                  <View style={styles.modalSection}>
                    <DetailRow label="Email" value={selectedMember.email} />
                    {selectedMember.phone && (
                      <DetailRow label="Phone" value={selectedMember.phone} />
                    )}
                    {selectedMember.house && (
                      <DetailRow label="House" value={selectedMember.house} />
                    )}
                    {selectedMember.gender && (
                      <DetailRow label="Gender" value={selectedMember.gender} />
                    )}
                    <DetailRow label="Address" value={selectedMember.address || 'Not provided'} multiline />
                    {selectedMember.role && (
                      <DetailRow label="Role" value={selectedMember.role} />
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    {selectedMember.phone && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleCall(selectedMember.phone)}
                      >
                        <Feather name="phone" size={18} color={colors.white} />
                        <Text style={styles.actionButtonText}>Call</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEmail(selectedMember.email)}
                    >
                      <Feather name="mail" size={18} color={colors.white} />
                      <Text style={styles.actionButtonText}>Email</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{ label: string; value: string; multiline?: boolean }> = ({ 
  label, 
  value, 
  multiline 
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
  },
  chipsContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.border,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray.dark,
  },
  chipTextSelected: {
    color: colors.white,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  memberContact: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  memberHouse: {
    fontSize: 12,
    color: colors.gray.medium,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.white,
  },
  modalName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  modalProfession: {
    fontSize: 16,
    color: colors.gray.dark,
  },
  modalSection: {
    marginBottom: 24,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray.medium,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.primary,
  },
  detailValueMultiline: {
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default DirectoryScreen;
