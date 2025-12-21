import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  },
  register: async (data: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    password: string; 
    role?: string; 
    familyId?: string;
    validationCode?: string;
    isSuperUser?: boolean;
  }) => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('authToken');
  },
  getProfile: () => axiosInstance.get('/auth/profile'),
};

export const adminService = {
  togglePhase2: (eventId: string, isActive: boolean) =>
    axiosInstance.put(`/admin/event/${eventId}/phase2`, { isActive }),
  getEventStatus: (eventId: string) =>
    axiosInstance.get(`/admin/event/${eventId}/status`),
  getLeaderboard: (limit: number = 100) =>
    axiosInstance.get('/users/leaderboard', { params: { limit } }),
  generateAdminCode: () =>
    axiosInstance.post('/admin/admin-code'),
  getActiveCodes: () =>
    axiosInstance.get('/admin/admin-codes'),
  getUsers: () =>
    axiosInstance.get('/bulk/users'),
  getFamilies: () =>
    axiosInstance.get('/bulk/families'),
  deleteAllUsers: (confirmCode: string) =>
    axiosInstance.delete('/bulk/delete-all-users', { data: { confirmCode } }),
  importUsers: (users: any[]) =>
    axiosInstance.post('/bulk/import-users', { users }),
  clearLeaderboard: () =>
    axiosInstance.delete('/bulk/clear-leaderboard', { data: { confirmCode: 'CLEAR_LEADERBOARD' } }),
};

export const userService = {
  getUserProfile: (userId: string) =>
    axiosInstance.get(`/users/${userId}`),
  getFamilyTree: (familyId: string) =>
    axiosInstance.get(`/users/family/${familyId}/tree`),
  searchUsers: (query: string, limit: number = 20) =>
    axiosInstance.get('/users/search', { params: { q: query, limit } }),
};

export const pointsService = {
  addPoints: (userId: string, stallId: string, points: number, qrCodeData?: string) =>
    axiosInstance.post('/points/add', { userId, stallId, points, qrCodeData }),
  getUserPoints: (userId: string) =>
    axiosInstance.get(`/points/user/${userId}`),
  recordSale: (userId: string, stallId: string, amount: number, description?: string) =>
    axiosInstance.post('/points/sale', { userId, stallId, amount, description }),
  getStallSales: (stallId: string) =>
    axiosInstance.get(`/points/stall/${stallId}/sales`),
};

export default axiosInstance;
