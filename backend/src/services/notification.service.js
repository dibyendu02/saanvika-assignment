import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { sendPushNotification, sendMulticastNotification } from './firebase.service.js';

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} - Created notification
 */
export const createNotification = async (data) => {
    const { recipient, sender, title, message, type, relatedId } = data;

    const notification = await Notification.create({
        recipient,
        sender,
        title,
        message,
        type,
        relatedId,
    });

    // Send push notification to all user's devices
    try {
        const recipientUser = await User.findById(recipient).select('fcmTokens');
        if (recipientUser?.fcmTokens && recipientUser.fcmTokens.length > 0) {
            const tokens = recipientUser.getActiveFcmTokens();

            if (tokens.length > 0) {
                await sendMulticastNotification(
                    tokens,
                    { title, body: message },
                    {
                        type,
                        notificationId: notification._id.toString(),
                        relatedId: relatedId?.toString()
                    }
                );
            }
        }
    } catch (error) {
        console.error('Failed to send push notification:', error);
        // Don't fail the whole operation if push notification fails
    }

    return notification;
};

/**
 * Get user's notifications
 * @param {string} userId - User ID
 * @param {Object} options - Pagination options
 */
export const getMyNotifications = async (userId, options = {}) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name'),
        Notification.countDocuments({ recipient: userId }),
    ]);

    return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (to ensure ownership)
 */
export const markAsRead = async (notificationId, userId) => {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
    );
};

/**
 * Mark all as read
 * @param {string} userId - User ID
 */
export const markAllAsRead = async (userId) => {
    return await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );
};


/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {Object} requestingUser - User performing the action
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId, requestingUser) => {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new Error('Notification not found');
    }

    // Access control: User can only delete their own notifications
    // Super admin can delete any notification (optional, but good for admin)
    if (requestingUser.role === 'super_admin') {
        // Super admin bypass
    } else {
        if (notification.recipient.toString() !== requestingUser._id.toString()) {
            throw new Error('You are not authorized to delete this notification');
        }
    }

    await Notification.findByIdAndDelete(notificationId);
};

export default {
    createNotification,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
