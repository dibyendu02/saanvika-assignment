/**
 * Firebase Admin Service
 * Handles Firebase Cloud Messaging for push notifications
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = () => {
    if (firebaseInitialized) {
        return;
    }

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
            console.warn('⚠️  Firebase service account path not configured. Push notifications will be disabled.');
            return;
        }

        // Resolve path relative to project root
        const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

        if (!fs.existsSync(absolutePath)) {
            console.warn(`⚠️  Firebase service account file not found at: ${absolutePath}`);
            console.warn('Push notifications will be disabled.');
            return;
        }

        const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        console.warn('Push notifications will be disabled.');
    }
};

/**
 * Send push notification to a single device
 * @param {string} fcmToken - FCM token of the device
 * @param {Object} notification - Notification payload
 * @param {Object} data - Optional data payload
 */
export const sendPushNotification = async (fcmToken, notification, data = {}) => {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, error: 'Firebase not initialized' };
    }

    if (!fcmToken) {
        return { success: false, error: 'No FCM token provided' };
    }

    try {
        const message = {
            token: fcmToken,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: {
                ...data,
                clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
            webpush: {
                notification: {
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Push notification sent successfully:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Failed to send push notification:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to multiple devices
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Optional data payload
 */
export const sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, error: 'Firebase not initialized' };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
        return { success: false, error: 'No FCM tokens provided' };
    }

    try {
        const message = {
            tokens: fcmTokens,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: {
                ...data,
                clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
            webpush: {
                notification: {
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Sent ${response.successCount}/${fcmTokens.length} notifications`);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send to token ${idx}:`, resp.error);
                }
            });
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error) {
        console.error('❌ Failed to send multicast notification:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe tokens to a topic
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {string} topic - Topic name
 */
export const subscribeToTopic = async (fcmTokens, topic) => {
    if (!firebaseInitialized) {
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const response = await admin.messaging().subscribeToTopic(fcmTokens, topic);
        console.log(`✅ Subscribed ${response.successCount} tokens to topic: ${topic}`);
        return { success: true, successCount: response.successCount };
    } catch (error) {
        console.error('❌ Failed to subscribe to topic:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification payload
 * @param {Object} data - Optional data payload
 */
export const sendTopicNotification = async (topic, notification, data = {}) => {
    if (!firebaseInitialized) {
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const message = {
            topic,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data,
        };

        const response = await admin.messaging().send(message);
        console.log(`✅ Sent notification to topic ${topic}:`, response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Failed to send topic notification:', error.message);
        return { success: false, error: error.message };
    }
};

export default {
    initializeFirebase,
    sendPushNotification,
    sendMulticastNotification,
    subscribeToTopic,
    sendTopicNotification,
};
