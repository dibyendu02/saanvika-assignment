import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// VAPID key for web push
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app;
let messaging;

/**
 * Initialize Firebase
 */
export const initializeFirebase = () => {
    try {
        if (!firebaseConfig.apiKey) {
            console.warn('Firebase config not found. Push notifications disabled.');
            return null;
        }

        app = initializeApp(firebaseConfig);

        // Check if messaging is supported
        if ('Notification' in window && 'serviceWorker' in navigator) {
            messaging = getMessaging(app);
            console.log('✅ Firebase initialized successfully');
            return messaging;
        } else {
            console.warn('⚠️  Push notifications not supported in this browser');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const requestNotificationPermission = async () => {
    try {
        if (!messaging) {
            console.warn('Firebase messaging not initialized');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');

            // Get FCM token
            const token = await getToken(messaging, { vapidKey });

            if (token) {
                console.log('✅ FCM Token:', token);
                return token;
            } else {
                console.warn('⚠️  No FCM token available');
                return null;
            }
        } else {
            console.warn('⚠️  Notification permission denied');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting FCM token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback function to handle messages
 */
export const onMessageListener = (callback) => {
    if (!messaging) {
        console.warn('Firebase messaging not initialized');
        return () => { };
    }

    return onMessage(messaging, (payload) => {
        console.log('📩 Foreground message received:', payload);

        // Show browser notification
        if (payload.notification) {
            const { title, body } = payload.notification;

            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: payload.data,
                });
            }
        }

        // Call custom callback
        if (callback) {
            callback(payload);
        }
    });
};

/**
 * Generate a unique device ID for this browser/device
 * @returns {string} - Unique device ID
 */
const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');

    if (!deviceId) {
        // Generate a unique ID based on browser fingerprint
        deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('deviceId', deviceId);
    }

    return deviceId;
};

/**
 * Save FCM token to backend with device information
 * @param {string} token - FCM token
 * @param {Function} apiCall - API function to save token
 * @param {string} platform - Platform (defaults to 'web')
 */
export const saveFCMToken = async (token, apiCall, platform = 'web') => {
    try {
        if (!token) {
            console.warn('No FCM token to save');
            return false;
        }

        const deviceId = getDeviceId();

        await apiCall({
            fcmToken: token,
            deviceId,
            platform
        });

        console.log('✅ FCM token saved to backend for device:', deviceId);
        return true;
    } catch (error) {
        console.error('❌ Failed to save FCM token:', error);
        return false;
    }
};

export default {
    initializeFirebase,
    requestNotificationPermission,
    onMessageListener,
    saveFCMToken,
};
