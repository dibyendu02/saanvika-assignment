/**
 * FCM Token API
 * API calls for FCM token management
 */

import apiClient from './client';

export interface FCMTokenData {
    fcmToken: string;
    deviceId: string;
    platform: 'android' | 'ios';
}

export interface UserDevice {
    deviceId: string;
    platform: string;
    lastUsed: string;
}

export const fcmApi = {
    /**
     * Register or update FCM token for current device
     */
    async registerFCMToken(tokenData: FCMTokenData): Promise<void> {
        await apiClient.post('/users/fcm-token', tokenData);
    },

    /**
     * Remove FCM token for current device
     */
    async removeFCMToken(deviceId: string): Promise<void> {
        await apiClient.delete('/users/fcm-token', {
            data: { deviceId },
        });
    },

    /**
     * Get all registered devices for current user
     */
    async getUserDevices(): Promise<UserDevice[]> {
        const response = await apiClient.get('/users/fcm-devices');
        return response.data.data.devices || [];
    },
};

export default fcmApi;
