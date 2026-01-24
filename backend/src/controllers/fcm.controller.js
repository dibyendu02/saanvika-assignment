/**
 * User Controller - FCM Token Management
 */
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Add/Update user's FCM token for a device
 * @route   POST /api/v1/users/fcm-token
 * @access  Private
 */
export const updateFCMToken = asyncHandler(async (req, res) => {
    const { fcmToken, deviceId, platform = 'web' } = req.body;
    const userId = req.user._id;

    if (!fcmToken || !deviceId) {
        return res.status(400).json({
            success: false,
            message: 'FCM token and device ID are required',
        });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    await user.addFcmToken(fcmToken, deviceId, platform);

    res.status(200).json({
        success: true,
        message: 'FCM token updated successfully',
        data: {
            deviceId,
            platform,
            totalDevices: user.fcmTokens.length
        },
    });
});

/**
 * @desc    Remove user's FCM token for a device (logout from device)
 * @route   DELETE /api/v1/users/fcm-token
 * @access  Private
 */
export const removeFCMToken = asyncHandler(async (req, res) => {
    const { deviceId } = req.body;
    const userId = req.user._id;

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            message: 'Device ID is required',
        });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    await user.removeFcmToken(deviceId);

    res.status(200).json({
        success: true,
        message: 'FCM token removed successfully',
        data: {
            deviceId,
            remainingDevices: user.fcmTokens.length
        },
    });
});

/**
 * @desc    Get all registered devices for the user
 * @route   GET /api/v1/users/fcm-devices
 * @access  Private
 */
export const getUserDevices = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select('fcmTokens');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    // Return device info without exposing actual tokens
    const devices = user.fcmTokens.map(t => ({
        deviceId: t.deviceId,
        platform: t.platform,
        addedAt: t.addedAt,
        lastUsed: t.lastUsed,
    }));

    res.status(200).json({
        success: true,
        data: { devices, totalDevices: devices.length },
    });
});

export default {
    updateFCMToken,
    removeFCMToken,
    getUserDevices,
};
