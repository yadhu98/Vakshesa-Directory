
import axios from 'axios';

// API Base URL Configuration
const API_BASE_URL = 'http://localhost:5001/api'; // Update as needed


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to normalize user data (id/_id)
const normalizeUser = (user: any) => ({
  ...user,
  _id: user._id || user.id,
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    localStorage.setItem('authToken', response.data.token);
    const userData = normalizeUser(response.data.user);
    localStorage.setItem('userData', JSON.stringify(userData));
    return response.data;
  },
  register: async (userData: any) => {
    const response = await axiosInstance.post('/auth/register', userData);
    localStorage.setItem('authToken', response.data.token);
    const normalizedUser = normalizeUser(response.data.user);
    localStorage.setItem('userData', JSON.stringify(normalizedUser));
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },
  getProfile: () => axiosInstance.get('/auth/profile'),
  changePassword: async (currentPassword: string, newPassword: string) => {
    return axiosInstance.put('/auth/change-password', { currentPassword, newPassword });
  },
};

export const userService = {
  getUserProfile: (userId: string) =>
    axiosInstance.get(`/users/${userId}`),
  getFamilyTree: (familyId: string) =>
    axiosInstance.get(`/users/family/${familyId}/tree`),
  searchUsers: (query: string, limit: number = 20) =>
    axiosInstance.get('/users/search', { params: { q: query, limit } }),
  updateUserProfile: (userId: string, data: any) =>
    axiosInstance.put(`/users/${userId}`, data),
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
