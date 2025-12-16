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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profession?: string;
  familyId: string;
  familyName?: string;
}

const DirectoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, selectedFamily, members]);

  const loadData = async () => {
    try {
      const [usersRes, familiesRes] = await Promise.all([
        api.get('/bulk/users'),
        api.get('/bulk/families'),
      ]);

      const users = usersRes.data.users || [];
      const familiesData = familiesRes.data || [];
      
      setFamilies(familiesData);

      // Map family names to users
      const usersWithFamily = users.map((user: any) => {
        const family = familiesData.find((f: any) => f._id === user.familyId);
        return {
          ...user,
          familyName: family?.name || 'Unknown',
        };
      });

      setMembers(usersWithFamily);
      setFilteredMembers(usersWithFamily);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by family
    if (selectedFamily !== 'all') {
      filtered = filtered.filter(m => m.familyId === selectedFamily);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.profession?.toLowerCase().includes(query) ||
        m.familyName?.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMemberPress = (member: Member) => {
    // Navigate to profile screen
    navigation.navigate('Profile' as never, { userId: member._id } as never);
  };

  const renderMemberCard = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => handleMemberPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        {item.profession && (
          <Text style={styles.memberProfession}>👔 {item.profession}</Text>
        )}
        <Text style={styles.memberEmail}>✉️ {item.email}</Text>
        {item.phone && (
          <Text style={styles.memberPhone}>📱 {item.phone}</Text>
        )}
        <Text style={styles.memberFamily}>👨‍👩‍👧‍👦 {item.familyName}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📖 Member Directory</Text>
        <Text style={styles.headerSubtitle}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by name, email, profession..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Family:</Text>
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[styles.chip, selectedFamily === 'all' && styles.chipActive]}
            onPress={() => setSelectedFamily('all')}
          >
            <Text style={[styles.chipText, selectedFamily === 'all' && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {families.map(family => (
            <TouchableOpacity
              key={family._id}
              style={[styles.chip, selectedFamily === family._id && styles.chipActive]}
              onPress={() => setSelectedFamily(family._id)}
            >
              <Text style={[styles.chipText, selectedFamily === family._id && styles.chipTextActive]}>
                {family.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item._id}
        renderItem={renderMemberCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />
    </View>
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
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  memberProfession: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  memberFamily: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '600',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    color: '#d1d5db',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

export default DirectoryScreen;
