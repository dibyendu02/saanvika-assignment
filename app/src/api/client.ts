/**
 * Axios API Client
 * Configured with base URL, auth interceptors, and error handling
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token from storage:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and redirect to login
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
            } catch (storageError) {
                console.error('Error clearing storage:', storageError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
