/**
 * FCM Service
 * Handles Firebase Cloud Messaging functionality
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { fcmApi } from '../api/fcm';
import { showToast } from '../utils/toast';
import { navigate } from './NavigationService';

const DEVICE_TOKEN_KEY = 'fcm_device_token';
const DEVICE_ID_KEY = 'device_id';

/**
 * Generate a unique device ID
 */
const generateDeviceId = (): string => {
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create device ID
 */
const getDeviceId = async (): Promise<string> => {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

export const fcmService = {
    /**
     * Initialize FCM and request permissions
     */
    async initialize(): Promise<boolean> {
        try {
            // Request Firebase permission
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ FCM initialized successfully');
            } else {
                console.log('❌ FCM permission denied');
            }

            return enabled;
        } catch (error) {
            console.error('Error initializing notifications:', error);
            return false;
        }
    },

    /**
     * Get FCM token and register with backend
     */
    async registerToken(): Promise<void> {
        try {
            // Get device ID
            const deviceId = await getDeviceId();

            // Get FCM token
            const token = await messaging().getToken();

            if (!token) {
                console.log('No FCM token available');
                return;
            }

            console.log('FCM Token obtained');

            // Save token locally
            await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);

            // Register with backend
            await fcmApi.registerFCMToken({
                fcmToken: token,
                deviceId,
                platform: Platform.OS as 'android' | 'ios',
            });

            console.log('✅ FCM token registered with backend');
        } catch (error) {
            console.error('Error registering FCM token:', error);
            showToast.error('Error', 'Failed to register for notifications');
        }
    },

    /**
     * Remove FCM token from backend
     */
    async removeToken(): Promise<void> {
        try {
            const deviceId = await getDeviceId();
            await fcmApi.removeFCMToken(deviceId);
            await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
            await messaging().deleteToken();
            console.log('✅ FCM token removed successfully');
        } catch (error) {
            console.error('Error removing FCM token:', error);
        }
    },

    /**
     * Setup notification handlers
     */
    setupNotificationHandlers(onNotificationReceived?: (notification: any) => void) {
        // Foreground message handler
        messaging().onMessage(async remoteMessage => {
            console.log('📬 Foreground notification:', remoteMessage);

            if (onNotificationReceived) {
                onNotificationReceived(remoteMessage);
            }

            // Show toast for foreground notifications
            if (remoteMessage.notification) {
                showToast.info(
                    remoteMessage.notification.title || 'Notification',
                    remoteMessage.notification.body || ''
                );
            }
        });

        // Notification opened app from quit state (Firebase handler)
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('📬 Notification opened app from quit state:', remoteMessage);
                    this.handleNotificationOpen(remoteMessage);
                }
            });

        // Notification opened app from background state (Firebase handler)
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('📬 Notification opened app from background (Firebase):', remoteMessage);
            this.handleNotificationOpen(remoteMessage);
        });

        console.log('✅ Notification handlers setup complete');
    },

    /**
     * Handle notification open/tap
     */
    handleNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
        const { data } = remoteMessage;

        if (!data) return;

        console.log('Processing notification data for navigation:', data);

        // Check for specific navigation targets
        if (data.screen === 'location_request' || data.type === 'location_request') {
            console.log('🚀 Navigating to Location Requests');

            // Navigate through the nested structure
            navigate('Main', {
                screen: 'More',
                params: {
                    screen: 'LocationRequests'
                }
            });
        }
    },

    /**
     * Handle token refresh
     */
    onTokenRefresh(callback: (token: string) => void) {
        messaging().onTokenRefresh(async token => {
            console.log('🔄 FCM token refreshed');
            await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);

            try {
                const deviceId = await getDeviceId();
                await fcmApi.registerFCMToken({
                    fcmToken: token,
                    deviceId,
                    platform: Platform.OS as 'android' | 'ios',
                });
                callback(token);
            } catch (error) {
                console.error('Error updating refreshed token:', error);
            }
        });
    },
};

export default fcmService;
