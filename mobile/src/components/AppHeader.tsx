import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  house?: string;
  profession?: string;
  role: string;
  familyName?: string;
}

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
  },
};

const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = false, showBackButton = false, onBack }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleLogout = async () => {
    // On web, Alert.alert doesn't work well, so use window.confirm
    const isWeb = Platform.OS === 'web';
    
    const confirmLogout = isWeb 
      ? (typeof (global as any).window !== 'undefined' && (global as any).window.confirm('Are you sure you want to logout?'))
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]
          );
        });

    if (!confirmLogout) return;

    try {
      // Clear all auth-related storage items
      await AsyncStorage.multiRemove(['authToken', 'userData', 'token', 'user']);
      setShowProfileModal(false);
      setUser(null);
      // The RootNavigator will automatically detect auth state change and redirect
    } catch (error) {
      console.error('Logout error:', error);
      if (isWeb) {
        if (typeof (global as any).window !== 'undefined') {
          (global as any).window.alert('Failed to logout');
        }
      } else {
        Alert.alert('Error', 'Failed to logout');
      }
    }
  };

  const getInitials = (userData?: User | null) => {
    if (!userData) return 'U';
    
    // Try firstName + lastName first
    if (userData.firstName && userData.lastName) {
      return (userData.firstName[0] + userData.lastName[0]).toUpperCase();
    }
    
    // Fall back to name field
    if (userData.name && typeof userData.name === 'string') {
      const trimmedName = userData.name.trim();
      if (trimmedName) {
        const parts = trimmedName.split(' ').filter(p => p.length > 0);
        if (parts.length > 0) {
          return parts
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        }
      }
    }
    
    return 'U';
  };

  const getUserName = (userData?: User | null) => {
    if (!userData) return 'User';
    
    // Try firstName + lastName first
    if (userData.firstName || userData.lastName) {
      return `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
    }
    
    // Fall back to name field
    return userData.name || 'User';
  };

  const getRoleDisplay = (role?: string) => {
    if (!role) return 'Member';
    switch (role) {
      case 'admin': return 'Administrator';
      case 'shopkeeper': return 'Shopkeeper';
      default: return 'Member';
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {(showBack || showBackButton) && (
            <TouchableOpacity
              onPress={() => {
                if (onBack) {
                  onBack();
                } else {
                  navigation.goBack();
                }
              }}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => setShowProfileModal(true)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar and Name */}
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>
                    {getInitials(user)}
                  </Text>
                </View>
                <Text style={styles.profileName}>{getUserName(user)}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user ? getRoleDisplay(user.role) : 'Member'}
                  </Text>
                </View>
              </View>

              {/* Profile Details */}
              <View style={styles.detailsSection}>
                {user?.email && (
                  <View style={styles.detailRow}>
                    <Feather name="mail" size={16} color={colors.primary} style={styles.detailIcon} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{user.email}</Text>
                    </View>
                  </View>
                )}

                {user?.phone && (
                  <View style={styles.detailRow}>
                    <Feather name="phone" size={16} color={colors.primary} style={styles.detailIcon} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{user.phone}</Text>
                    </View>
                  </View>
                )}

                {user?.house && (
                  <View style={styles.detailRow}>
                    <Feather name="home" size={16} color={colors.primary} style={styles.detailIcon} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>House</Text>
                      <Text style={styles.detailValue}>{user.house}</Text>
                    </View>
                  </View>
                )}

                {user?.familyName && (
                  <View style={styles.detailRow}>
                    <Feather name="users" size={16} color={colors.primary} style={styles.detailIcon} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Family</Text>
                      <Text style={styles.detailValue}>{user.familyName}</Text>
                    </View>
                  </View>
                )}

                {user?.profession && (
                  <View style={styles.detailRow}>
                    <Feather name="briefcase" size={16} color={colors.primary} style={styles.detailIcon} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Profession</Text>
                      <Text style={styles.detailValue}>{user.profession}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setShowProfileModal(false)}
              >
                <Feather name="x" size={18} color={colors.primary} />
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Feather name="log-out" size={18} color={colors.white} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.border,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  avatarButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
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
    padding: 24,
    width: '85%',
    maxHeight: '75%',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.border,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  largeAvatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray.border,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.border,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  closeButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray.border,
  },
  closeButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: colors.primary,
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AppHeader;
