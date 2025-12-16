import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  house?: string;
  generation?: number;
  address?: string;
  profession?: string;
  familyId: string;
  familyName?: string;
  role: string;
  tokenBalance?: number;
  totalPoints?: number;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  children?: string[];
  isAlive?: boolean;
  createdAt?: string;
}

const EnhancedProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { userId?: string } | undefined;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [params?.userId]);

  const loadProfile = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
      
      const targetUserId = params?.userId || currentUser?._id;
      setIsOwnProfile(!params?.userId || params.userId === currentUser?._id);

      if (!targetUserId) {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
        return;
      }

      // Load user profile
      const profileRes = await api.get(`/users/${targetUserId}`);
      const userData = profileRes.data.user;

      // Load family name
      const familiesRes = await api.get('/bulk/families');
      const families = familiesRes.data || [];
      const family = families.find((f: any) => f._id === userData.familyId);

      // Load tokens and points
      let tokenBalance = 0;
      let totalPoints = 0;

      try {
        const tokenRes = await api.get('/tokens/balance', { params: { userId: targetUserId } });
        tokenBalance = tokenRes.data.balance || 0;
      } catch (e) {}

      try {
        const pointsRes = await api.get(`/points/user/${targetUserId}`);
        totalPoints = pointsRes.data.totalPoints || 0;
      } catch (e) {}

      const fullProfile: UserProfile = {
        ...userData,
        familyName: family?.name || 'Unknown',
        tokenBalance,
        totalPoints,
      };

      setProfile(fullProfile);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={isOwnProfile ? "My Profile" : "Profile"} showBackButton />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.firstName[0]}{profile.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{profile.house || 'No House'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
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

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <InfoRow label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
          <InfoRow label="Email" value={profile.email} />
          {profile.phone && <InfoRow label="Phone" value={profile.phone} />}
          {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
          {profile.profession && <InfoRow label="Profession" value={profile.profession} />}
          {profile.address && <InfoRow label="Address" value={profile.address} multiline />}
          <InfoRow label="Status" value={profile.isAlive !== false ? 'Active' : 'Inactive'} />
        </View>

        {/* Family Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Information</Text>
          
          <InfoRow label="Family ID" value={profile.familyId} />
          <InfoRow label="Family Name" value={profile.familyName || 'Unknown'} />
          <InfoRow label="House" value={profile.house || 'Not assigned'} />
          {profile.fatherId && <InfoRow label="Father ID" value={profile.fatherId} />}
          {profile.motherId && <InfoRow label="Mother ID" value={profile.motherId} />}
          {profile.spouseId && <InfoRow label="Spouse ID" value={profile.spouseId} />}
          {profile.children && profile.children.length > 0 && (
            <InfoRow label="Children" value={`${profile.children.length} children`} />
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <InfoRow label="User ID" value={profile._id} />
          <InfoRow label="Role" value={profile.role} />
          {profile.createdAt && (
            <InfoRow 
              label="Member Since" 
              value={new Date(profile.createdAt).toLocaleDateString()} 
            />
          )}
        </View>

        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string; multiline?: boolean }> = ({ 
  label, 
  value, 
  multiline 
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#000000',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgeSecondary: {
    backgroundColor: '#F5F5F5',
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#000000',
  },
  infoValueMultiline: {
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#000000',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedProfileScreen;
