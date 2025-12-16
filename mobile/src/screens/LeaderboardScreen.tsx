import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { leaderboardService } from '../services/api';
import { LeaderboardEntry } from '../types/index';
import AppHeader from '../components/AppHeader';

export const LeaderboardScreen: React.FC = () => {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const loadLeaderboard = async () => {
        try {
          const response = await leaderboardService.getLeaderboard(100);
          setLeaderboard(response.data.leaderboard);
        } catch (error) {
          console.error('Failed to load leaderboard:', error);
        } finally {
          setLoading(false);
        }
      };

      loadLeaderboard();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Leaderboard" />
      <View style={styles.content}>
      
      {leaderboard.length > 0 ? (
        <View style={styles.listContainer}>
          {leaderboard.map((entry: LeaderboardEntry) => (
            <View key={entry.userId} style={styles.leaderboardItem}>
              <Text style={styles.rank}>#{entry.rank}</Text>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{entry.userName}</Text>
              </View>
              <Text style={styles.points}>{entry.totalPoints}pts</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No leaderboard data available</Text>
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  listContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginRight: 12,
    width: 40,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
