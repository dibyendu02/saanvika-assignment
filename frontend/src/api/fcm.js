/**
 * FCM Token API
 * Handles FCM token registration and device management
 */
import api from './axios';

/**
 * Register or update FCM token for current device
 * @param {Object} tokenData - Token data {fcmToken, deviceId, platform}
 * @returns {Promise} - API response
 */
export const registerFCMToken = async (tokenData) => {
    const response = await api.post('/users/fcm-token', tokenData);
    return response.data;
};

/**
 * Remove FCM token for current device
 * @param {string} deviceId - Device ID to remove
 * @returns {Promise} - API response
 */
export const removeFCMToken = async (deviceId) => {
    const response = await api.delete('/users/fcm-token', {
        data: { deviceId }
    });
    return response.data;
};

/**
 * Get all registered devices for current user
 * @returns {Promise} - API response with devices list
 */
export const getUserDevices = async () => {
    const response = await api.get('/users/fcm-devices');
    return response.data;
};

export default {
    registerFCMToken,
    removeFCMToken,
    getUserDevices,
};
