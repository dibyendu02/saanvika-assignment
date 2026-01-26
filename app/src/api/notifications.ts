/**
 * Notifications API
 * API calls for notification management
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';

export interface Notification {
    _id: string;
    recipient: string;
    sender?: {
        _id: string;
        name: string;
    };
    title: string;
    message: string;
    type: 'location_request' | 'location_shared' | 'goodies_distributed' | 'general';
    relatedId?: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    totalPages: number;
    currentPage: number;
    totalNotifications: number;
    unreadCount: number;
}

export const notificationsApi = {
    /**
     * Get current user's notifications
     */
    async getNotifications(params?: {
        page?: number;
        limit?: number;
    }): Promise<NotificationsResponse> {
        const queryParams = {
            page: params?.page || 1,
            limit: params?.limit || 20,
        };
        const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, { params: queryParams });
        return response.data.data;
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<Notification> {
        const response = await apiClient.patch(API_ENDPOINTS.MARK_READ(notificationId));
        return response.data.data.notification;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await apiClient.patch(API_ENDPOINTS.MARK_ALL_READ);
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.NOTIFICATION_BY_ID(notificationId));
    },
};

export default notificationsApi;
