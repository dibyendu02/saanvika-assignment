/**
 * Attendance API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';
import { Attendance } from '../types';

export const attendanceApi = {
    /**
     * Get all attendance records
     */
    getAll: async (params?: {
        officeId?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Attendance[]> => {
        const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE, { params });
        // Backend returns paginated data: { success: true, data: { records: [], total, page, limit } }
        return response.data.data?.records || response.data.data || response.data || [];
    },

    /**
     * Check today's attendance
     */
    checkToday: async (): Promise<{ hasMarked: boolean; attendance?: Attendance }> => {
        const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE_TODAY);
        return response.data.data || response.data;
    },

    /**
     * Mark attendance
     */
    mark: async (data: {
        longitude: number;
        latitude: number;
    }): Promise<Attendance> => {
        const response = await apiClient.post(API_ENDPOINTS.MARK_ATTENDANCE, data);
        return response.data.data || response.data;
    },
};

export default attendanceApi;
