/**
 * Notification Controller
 * Handles notification-related HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

/**
 * @desc    Get current user's notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getMyNotifications(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
    });

    res.status(200).json({
        success: true,
        data: result,
        message: 'Notifications fetched successfully',
    });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found',
        });
    }

    res.status(200).json({
        success: true,
        data: { notification },
        message: 'Notification marked as read',
    });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
    });

});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id, req.user);
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        if (error.message === 'Notification not found') {
            res.status(404);
            throw error;
        } else if (error.message === 'You are not authorized to delete this notification') {
            res.status(403);
            throw error;
        }
        throw error;
    }
});

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
