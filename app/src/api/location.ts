/**
 * Location API
 * API calls for location sharing and requests
 */

import apiClient from './client';

export interface LocationRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    location: {
        type: string;
        coordinates: number[];
    };
    reason?: string;
    sharedAt: string;
}

export interface LocationRequest {
    _id: string;
    requester: {
        _id: string;
        name: string;
        email: string;
    };
    targetUser: {
        _id: string;
        name: string;
        email: string;
    };
    status: 'pending' | 'shared' | 'denied' | 'expired';
    requestedAt: string;
    respondedAt?: string;
    locationId?: string | { _id: string };
}

export interface ShareLocationPayload {
    latitude: number;
    longitude: number;
    reason?: string;
    requestId?: string;
}

export const locationApi = {
    /**
     * Get all location records with optional filters
     */
    async getLocations(params?: {
        page?: number;
        limit?: number;
        officeId?: string;
    }): Promise<{
        records: LocationRecord[];
        currentPage: number;
        totalPages: number;
        totalRecords: number;
    }> {
        const queryParams: any = {
            page: params?.page || 1,
            limit: params?.limit || 10,
        };

        if (params?.officeId && params.officeId !== 'all') {
            queryParams.officeId = params.officeId;
        }

        const response = await apiClient.get('/location', { params: queryParams });
        return response.data.data;
    },

    /**
     * Get location by ID
     */
    async getLocationById(id: string): Promise<LocationRecord> {
        const response = await apiClient.get(`/location/${id}`);
        return response.data.data;
    },

    /**
     * Share current location
     */
    async shareLocation(payload: ShareLocationPayload): Promise<LocationRecord> {
        const response = await apiClient.post('/location/share', payload);
        return response.data.data;
    },

    /**
     * Get location requests
     */
    async getLocationRequests(officeId?: string): Promise<LocationRequest[]> {
        const params: any = {};
        if (officeId && officeId !== 'all') {
            params.officeId = officeId;
        }
        const response = await apiClient.get('/location/requests', { params });
        return response.data.data.requests || [];
    },

    /**
     * Deny a location request
     */
    async denyLocationRequest(requestId: string): Promise<void> {
        await apiClient.patch(`/location/requests/${requestId}/deny`);
    },
};

export default locationApi;
