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
        let serviceAccount = null;

        // Attempt to load credentials from environment variable (recommended for cloud platforms)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

                if (serviceAccount.private_key) {
                    serviceAccount.private_key =
                        serviceAccount.private_key.replace(/\\n/g, '\n');
                }
            } catch (error) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error.message);
            }
        }

        // Fallback to loading credentials from file
        if (!serviceAccount) {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

            if (!serviceAccountPath) {
                console.warn('Firebase credentials not configured. Push notifications disabled.');
                return;
            }

            const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

            if (!fs.existsSync(absolutePath)) {
                console.warn(`Firebase service account file not found at ${absolutePath}`);
                console.warn('Push notifications disabled.');
                return;
            }

            serviceAccount = JSON.parse(
                fs.readFileSync(absolutePath, 'utf8')
            );
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        console.warn('Push notifications disabled.');
    }
};

/**
 * Send push notification to a single device
 */
export const sendPushNotification = async (fcmToken, notification, data = {}) => {
    if (!firebaseInitialized) {
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
        return { success: true, messageId: response };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            isUnregistered:
                error.code === 'messaging/registration-token-not-registered',
        };
    }
};

/**
 * Send push notification to multiple devices
 */
export const sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
    if (!firebaseInitialized) {
        return { success: false, error: 'Firebase not initialized' };
    }

    if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
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

        const unregisteredTokens = [];
        const otherFailedTokens = [];

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const err = resp.error;
                    if (err?.code === 'messaging/registration-token-not-registered') {
                        unregisteredTokens.push(fcmTokens[idx]);
                    } else {
                        otherFailedTokens.push({
                            token: fcmTokens[idx],
                            error: err?.message || 'Unknown error',
                        });
                    }
                }
            });
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            unregisteredTokens,
            otherFailedTokens,
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe tokens to a topic
 */
export const subscribeToTopic = async (fcmTokens, topic) => {
    if (!firebaseInitialized) {
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const response = await admin.messaging().subscribeToTopic(fcmTokens, topic);
        return { success: true, successCount: response.successCount };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to a topic
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
        return { success: true, messageId: response };
    } catch (error) {
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