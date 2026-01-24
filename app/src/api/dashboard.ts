/**
 * Dashboard API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';
import { DashboardStats } from '../types';

export const dashboardApi = {
    /**
     * Get dashboard statistics - matches web app implementation
     */
    getStats: async (): Promise<DashboardStats> => {
        try {
            // Fetch from multiple endpoints like the web app does
            const [officesRes, attendanceRes, goodiesRes, summaryRes, usersRes] = await Promise.all([
                apiClient.get('/offices?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                apiClient.get('/attendance?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                apiClient.get('/goodies/distributions?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
                apiClient.get(API_ENDPOINTS.DASHBOARD_SUMMARY).catch(() => ({ data: { data: { summary: null } } })),
                apiClient.get('/users?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
            ]);

            const summary = summaryRes.data.data?.summary;

            return {
                totalOffices: officesRes.data.data?.total || 0,
                activeOffices: officesRes.data.data?.total || 0,
                totalEmployees: usersRes.data.data?.total || 0,
                attendanceToday: attendanceRes.data.data?.total || 0,
                goodiesManaged: goodiesRes.data.data?.total || 0,
                officeTargets: (summary?.officeTargets || []).map((target: any) => ({
                    officeId: target.officeId,
                    officeName: target.officeName,
                    current: target.currentHeadcount,
                    target: target.targetHeadcount,
                    percentage: target.progress,
                })),
            };
        } catch (error) {
            console.error('Dashboard API error:', error);
            // Return default values on error
            return {
                totalOffices: 0,
                activeOffices: 0,
                totalEmployees: 0,
                attendanceToday: 0,
                goodiesManaged: 0,
                officeTargets: [],
            };
        }
    },
};

export default dashboardApi;
