/**
 * Authentication API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';
import { AuthResponse } from '../types';

export const authApi = {
    /**
     * Login user
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
            email,
            password,
        });
        // Backend returns: { success: true, data: { user, token }, message: '...' }
        return response.data.data;
    },

    /**
     * Register new user
     */
    register: async (userData: {
        name: string;
        email: string;
        password: string;
        role?: string;
        primaryOfficeId?: string;
    }): Promise<AuthResponse> => {
        const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
        // Backend returns: { success: true, data: { user, token }, message: '...' }
        return response.data.data;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.LOGOUT);
    },
};

export default authApi;
