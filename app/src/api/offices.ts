/**
 * Offices API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';
import { Office } from '../types';

export const officesApi = {
    /**
     * Get all offices
     */
    getAll: async (params?: { status?: string }): Promise<Office[]> => {
        const response = await apiClient.get(API_ENDPOINTS.OFFICES, { params });
        // Backend returns paginated data: { success: true, data: { offices: [], total, page, limit } }
        return response.data.data?.offices || response.data.data || response.data || [];
    },

    /**
     * Get office by ID
     */
    getById: async (id: string): Promise<Office> => {
        const response = await apiClient.get(API_ENDPOINTS.OFFICE_BY_ID(id));
        return response.data.data || response.data;
    },

    /**
     * Create new office
     */
    create: async (officeData: {
        name: string;
        address: string;
        location: {
            type: 'Point';
            coordinates: [number, number];
        };
        targetHeadcount: number;
        officeType?: 'main' | 'branch';
        officeId: string;
    }): Promise<Office> => {
        const response = await apiClient.post(API_ENDPOINTS.OFFICES, officeData);
        return response.data.data?.office || response.data.data || response.data;
    },

    /**
     * Update office
     */
    update: async (id: string, officeData: Partial<Office>): Promise<Office> => {
        const response = await apiClient.put(API_ENDPOINTS.OFFICE_BY_ID(id), officeData);
        return response.data.data || response.data;
    },

    /**
     * Delete office
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(API_ENDPOINTS.OFFICE_BY_ID(id));
    },
};

export default officesApi;
