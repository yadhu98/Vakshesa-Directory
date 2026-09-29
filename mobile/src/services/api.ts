import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseURL = () => {
  if (Platform.OS === 'web') return 'http://localhost:5001/api';

  // Expo Go's host URI contains the computer's LAN IP, reachable by the phone.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:5001/api`;
};

const API_BASE_URL = getBaseURL();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    await AsyncStorage.setItem('authToken', response.data.token);
    // Normalize user data - backend returns 'id' but we need '_id'
    const userData = {
      ...response.data.user,
      _id: response.data.user._id || response.data.user.id,
    };
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    return response.data;
  },
  register: async (userData: any) => {
    const response = await axiosInstance.post('/auth/register', userData);
    // The approval flow returns 202 with no token — only persist when present.
    if (response.data.token) await AsyncStorage.setItem('authToken', response.data.token);
    if (response.data.user) {
      const normalizedUser = {
        ...response.data.user,
        _id: response.data.user._id || response.data.user.id,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(normalizedUser));
    }
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },
  getProfile: () => axiosInstance.get('/auth/profile'),
};

export const login = authService.login;
export const register = authService.register;

export const userService = {
  getUserProfile: (userId: string) =>
    axiosInstance.get(`/users/${userId}`),
  getFamilyTree: (familyId: string) =>
    axiosInstance.get(`/users/family/${familyId}/tree`),
  searchUsers: (query: string, limit: number = 20) =>
    axiosInstance.get('/users/search', { params: { q: query, limit } }),
};

export const pointsService = {
  getUserPoints: (userId: string) =>
    axiosInstance.get(`/points/user/${userId}`),
  addPoints: (userId: string, stallId: string, points: number) =>
    axiosInstance.post('/points/add', { userId, stallId, points }),
};

export const leaderboardService = {
  getLeaderboard: (limit: number = 100) =>
    axiosInstance.get('/users/leaderboard', { params: { limit } }),
};

export const api = axiosInstance;

export default axiosInstance;
