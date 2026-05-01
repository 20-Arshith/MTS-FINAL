import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, STORAGE_KEYS } from './config';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.log('Unauthorized request. Logging out...');
            await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
            // The UI should theoretically handle redirect on token loss
        }
        return Promise.reject(error);
    }
);

export const notificationService = {
    getMyNotifications: (limit = 10) => api.get('/notifications/my', { params: { limit } }),
    markRead: (id: number) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;
