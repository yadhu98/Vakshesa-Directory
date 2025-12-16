import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

interface UserProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  profession?: string;
  familyId: string;
  familyName?: string;
  role: string;
  tokenBalance?: number;
  totalPoints?: number;
  house?: string;
  generation?: number;
  address?: string;
  gender?: string;
  createdAt?: string;
}

const ProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { userId?: string } | undefined;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    profession: '',
  });

  useEffect(() => {
    loadProfile();
  }, [params?.userId]);

  const loadProfile = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
      
      console.log('Current user from storage:', currentUser);

      if (!currentUser?._id) {
        console.log('No user ID found in storage');
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const targetUserId = params?.userId || currentUser._id;
      setIsOwnProfile(!params?.userId || params.userId === currentUser._id);

      console.log('Loading profile for user ID:', targetUserId);

      // Load user profile
      const profileRes = await api.get(`/users/${targetUserId}`);
      console.log('Profile response:', profileRes.data);
      const userData = profileRes.data.user || profileRes.data;

      if (!userData) {
        console.log('No user data in response');
        Alert.alert('Error', 'User profile not found');
        return;
      }

      // Load family name
      let familyName = 'Unknown';
      try {
        const familiesRes = await api.get('/bulk/families');
        const families = familiesRes.data || [];
        const family = families.find((f: any) => f._id === userData.familyId);
        familyName = family?.name || 'Unknown';
      } catch (e) {
        console.log('Failed to load family:', e);
      }

      // Load tokens and points
      let tokenBalance = 0;
      let totalPoints = 0;

      try {
        const tokenRes = await api.get('/tokens/balance', { params: { userId: targetUserId } });
        tokenBalance = tokenRes.data.balance || 0;
      } catch (e) {
        console.log('Tokens not available:', e);
      }

      try {
        const pointsRes = await api.get(`/points/user/${targetUserId}`);
        totalPoints = pointsRes.data.totalPoints || 0;
      } catch (e) {
        console.log('Points not available:', e);
      }

      const fullProfile = {
        ...userData,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
        familyName,
        tokenBalance,
        totalPoints,
      };

      console.log('Setting profile:', fullProfile);
      setProfile(fullProfile);
      setEditData({
        name: fullProfile.name || '',
        phone: userData.phone || '',
        profession: userData.profession || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await api.put('/auth/profile', editData);
      
      // Update local profile
      setProfile({
        ...profile,
        ...editData,
      });

      // Update AsyncStorage if own profile
      if (isOwnProfile) {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const updated = { ...userData, ...editData };
          await AsyncStorage.setItem('userData', JSON.stringify(updated));
        }
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        name: profile.name,
        phone: profile.phone || '',
        profession: profile.profession || '',
      });
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              // Navigation will automatically redirect to auth screen
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Profile" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Profile" />
      <ScrollView style={styles.container}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          {!isEditing && (
            <Text style={styles.userName}>{profile.name}</Text>
          )}
          <View style={styles.userFamilyContainer}>
            <Feather name="users" size={16} color="#FFFFFF" />
            <Text style={styles.userFamily}>{profile.familyName}</Text>
          </View>
        </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Feather name="credit-card" size={24} color="#000000" style={styles.statIcon} />
          <Text style={styles.statValue}>{profile.tokenBalance || 0}</Text>
          <Text style={styles.statLabel}>Tokens</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="star" size={24} color="#000000" style={styles.statIcon} />
          <Text style={styles.statValue}>{profile.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Quick Actions */}
      {isOwnProfile && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <Feather name="edit" size={20} color="#000000" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChangePassword' as never)}
          >
            <Feather name="lock" size={20} color="#000000" />
            <Text style={styles.actionText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="user" size={16} color="#666666" />
              <Text style={styles.infoLabel}>Full Name</Text>
            </View>
            <Text style={styles.infoValue}>{profile.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="mail" size={16} color="#666666" />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>

          {profile.phone && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="phone" size={16} color="#666666" />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}

          {profile.gender && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="info" size={16} color="#666666" />
                <Text style={styles.infoLabel}>Gender</Text>
              </View>
              <Text style={styles.infoValue}>{profile.gender}</Text>
            </View>
          )}

          {profile.profession && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="briefcase" size={16} color="#666666" />
                <Text style={styles.infoLabel}>Profession</Text>
              </View>
              <Text style={styles.infoValue}>{profile.profession}</Text>
            </View>
          )}

          {profile.address && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="map-pin" size={16} color="#666666" />
                <Text style={styles.infoLabel}>Address</Text>
              </View>
              <Text style={[styles.infoValue, styles.infoValueMultiline]}>{profile.address}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Family Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Family Information</Text>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="users" size={16} color="#666666" />
              <Text style={styles.infoLabel}>Family</Text>
            </View>
            <Text style={styles.infoValue}>{profile.familyName}</Text>
          </View>

          {profile.house && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="home" size={16} color="#666666" />
                <Text style={styles.infoLabel}>House</Text>
              </View>
              <Text style={styles.infoValue}>{profile.house}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Information</Text>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="shield" size={16} color="#666666" />
              <Text style={styles.infoLabel}>Role</Text>
            </View>
            <Text style={styles.infoValue}>{profile.role}</Text>
          </View>

          {profile.createdAt && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Feather name="calendar" size={16} color="#666666" />
                <Text style={styles.infoLabel}>Member Since</Text>
              </View>
              <Text style={styles.infoValue}>{new Date(profile.createdAt).toLocaleDateString()}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Feather name="hash" size={16} color="#666666" />
              <Text style={styles.infoLabel}>User ID</Text>
            </View>
            <Text style={[styles.infoValue, styles.infoValueSmall]}>{profile._id}</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      {isOwnProfile && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeaderContent: {
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 32,
    marginBottom: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  userFamilyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userFamily: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  editButton: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#999999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  infoValueMultiline: {
    textAlign: 'right',
    lineHeight: 20,
  },
  infoValueSmall: {
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
