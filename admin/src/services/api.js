import axios from 'axios';
const API_BASE_URL = "https://vakshesa-directory.onrender.com/api";
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
    login: async (email, password) => {
        const response = await axiosInstance.post('/auth/login', { email, password });
        localStorage.setItem('authToken', response.data.token);
        return response.data;
    },
    register: async (data) => {
        const response = await axiosInstance.post('/auth/register', data);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('authToken');
    },
    getProfile: () => axiosInstance.get('/auth/profile'),
};
export const adminService = {
    togglePhase2: (eventId, isActive) => axiosInstance.put(`/admin/event/${eventId}/phase2`, { isActive }),
    getEventStatus: (eventId) => axiosInstance.get(`/admin/event/${eventId}/status`),
    getLeaderboard: (limit = 100) => axiosInstance.get('/users/leaderboard', { params: { limit } }),
};
export const userService = {
    getUserProfile: (userId) => axiosInstance.get(`/users/${userId}`),
    getFamilyTree: (familyId) => axiosInstance.get(`/users/family/${familyId}/tree`),
    searchUsers: (query, limit = 20) => axiosInstance.get('/users/search', { params: { q: query, limit } }),
};
export const pointsService = {
    addPoints: (userId, stallId, points, qrCodeData) => axiosInstance.post('/points/add', { userId, stallId, points, qrCodeData }),
    getUserPoints: (userId) => axiosInstance.get(`/points/user/${userId}`),
    recordSale: (userId, stallId, amount, description) => axiosInstance.post('/points/sale', { userId, stallId, amount, description }),
    getStallSales: (stallId) => axiosInstance.get(`/points/stall/${stallId}/sales`),
};
export default axiosInstance;
