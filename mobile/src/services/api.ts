import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL Configuration
// IMPORTANT: Set USE_DEV_TUNNEL to true when using VS Code dev tunnels
const USE_DEV_TUNNEL = true; // Set to true when using dev tunnels, false for local network

// Backend port forwarded URL from VS Code dev tunnels
// To get this:
// 1. In VS Code, open Ports view (Ctrl+Shift+P → "Ports: Focus on Ports View")
// 2. Click "Forward a Port" and enter 5000
// 3. Right-click port 5000 → Port Visibility → Public
// 4. Copy the forwarded URL and paste below
const DEV_TUNNEL_BACKEND_URL = 'http://localhost:5000/api'; // UPDATE THIS!

const getBaseURL = () => {
  if (USE_DEV_TUNNEL) {
    // Using VS Code dev tunnels - works on any device via internet
    return DEV_TUNNEL_BACKEND_URL;
  }
  
  if (Platform.OS === 'web') {
    // Local web browser
    return 'http://localhost:5000/api';
  }
  
  // Mobile device on same WiFi network
  return 'http://192.168.1.2:5000/api';
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
    await AsyncStorage.setItem('authToken', response.data.token);
    // Normalize user data - backend returns 'id' but we need '_id'
    const normalizedUser = {
      ...response.data.user,
      _id: response.data.user._id || response.data.user.id,
    };
    await AsyncStorage.setItem('userData', JSON.stringify(normalizedUser));
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
