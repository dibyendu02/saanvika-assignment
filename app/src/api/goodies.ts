/**
 * Goodies API
 * API calls for goodies distribution management
 */

import apiClient from './client';

export interface GoodiesDistribution {
    _id: string;
    goodiesType: string;
    totalQuantity: number;
    remainingCount: number;
    claimedCount: number;
    officeId: {
        _id: string;
        name: string;
    };
    distributionDate: string;
    distributedBy: {
        _id: string;
        name: string;
    };
    isForAllEmployees: boolean;
    targetEmployees?: any[];
    isReceived?: boolean;
    createdAt: string;
}

export interface ClaimRecord {
    _id: string;
    distributionId: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    receivedAt: string;
}

export interface CreateDistributionPayload {
    goodiesType: string;
    totalQuantity: number;
    officeId: string;
    distributionDate: string;
    isForAllEmployees: boolean;
    targetEmployees?: string[];
}

export const goodiesApi = {
    /**
     * Get all goodies distributions
     */
    async getDistributions(officeId?: string): Promise<GoodiesDistribution[]> {
        const params = new URLSearchParams();
        if (officeId && officeId !== 'all') {
            params.append('officeId', officeId);
        }
        const response = await apiClient.get(`/goodies/distributions?${params.toString()}`);
        const data = response.data.data;
        return data.distributions || data.docs || (Array.isArray(data) ? data : []);
    },

    /**
     * Create a new goodies distribution (admin only)
     */
    async createDistribution(payload: CreateDistributionPayload): Promise<GoodiesDistribution> {
        const response = await apiClient.post('/goodies/distributions', payload);
        return response.data.data;
    },

    /**
     * Claim goodies (employee only)
     */
    async claimGoodies(distributionId: string): Promise<void> {
        await apiClient.post('/goodies/receive', { distributionId });
    },

    /**
     * Get claim history for a distribution
     */
    async getDistributionClaims(distributionId: string): Promise<ClaimRecord[]> {
        const response = await apiClient.get(`/goodies/received?distributionId=${distributionId}&limit=100`);
        const data = response.data.data;
        return data.records || (Array.isArray(data) ? data : []);
    },

    /**
     * Get eligible employees for a distribution
     */
    async getEligibleEmployees(distributionId: string): Promise<any[]> {
        const response = await apiClient.get(`/goodies/distributions/${distributionId}/eligible-employees`);
        const data = response.data.data;
        return data.employees || [];
    },

    /**
     * Bulk upload distributions via Excel
     */
    async bulkUpload(formData: FormData): Promise<any> {
        const response = await apiClient.post('/goodies/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default goodiesApi;
