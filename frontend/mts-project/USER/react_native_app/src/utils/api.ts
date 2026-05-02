import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { API_BASE, STORAGE_KEYS } from './config';

export const AUTH_EVENTS = {
    UNAUTHORIZED: 'auth:unauthorized',
};

const AUTH_ENDPOINTS = [
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/register-vendor',
    '/auth/register-agent',
    '/auth/validate-agent-code',
];

const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

async function getStoredToken() {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const normalizedToken = token?.trim();

    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
        return null;
    }

    return normalizedToken;
}

export async function clearAuthSession() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
}

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await getStoredToken();
        const headers = AxiosHeaders.from(config.headers);

        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        } else {
            headers.delete('Authorization');
        }

        config.headers = headers;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
            console.log('Unauthorized request. Logging out...');
            await clearAuthSession();
            DeviceEventEmitter.emit(AUTH_EVENTS.UNAUTHORIZED, {
                message: error.response?.data?.message || 'Session expired. Please log in again.',
            });
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
