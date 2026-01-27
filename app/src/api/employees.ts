/**
 * Employees/Users API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../constants/api';
import { User } from '../types';

export const employeesApi = {
    /**
     * Get all employees
     */
    getAll: async (params?: { officeId?: string; role?: string }): Promise<User[]> => {
        const response = await apiClient.get(API_ENDPOINTS.USERS, { params });
        // Backend returns paginated data: { success: true, data: { users: [], total, page, limit } }
        return response.data.data?.users || response.data.data || response.data || [];
    },

    /**
     * Get employee by ID
     */
    getById: async (id: string): Promise<User> => {
        const response = await apiClient.get(API_ENDPOINTS.USER_BY_ID(id));
        return response.data.data || response.data;
    },

    /**
     * Get employees by office
     */
    getByOffice: async (officeId: string): Promise<User[]> => {
        const response = await apiClient.get(API_ENDPOINTS.USERS_BY_OFFICE(officeId));
        const data = response.data.data;
        return data?.users || data?.employees || (Array.isArray(data) ? data : []);
    },

    create: async (userData: {
        name: string;
        email: string;
        password: string;
        employeeId?: string;
        role: string;
        primaryOfficeId: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: string;
    }): Promise<User> => {
        const response = await apiClient.post(API_ENDPOINTS.CREATE_EMPLOYEE, userData);
        return response.data.data || response.data;
    },

    /**
     * Suspend employee
     */
    suspend: async (id: string): Promise<void> => {
        await apiClient.patch(`${API_ENDPOINTS.USER_BY_ID(id)}/suspend`);
    },

    /**
     * Unsuspend employee
     */
    unsuspend: async (id: string): Promise<void> => {
        await apiClient.patch(`${API_ENDPOINTS.USER_BY_ID(id)}/unsuspend`);
    },

    /**
     * Update employee
     */
    update: async (id: string, userData: Partial<User>): Promise<User> => {
        const response = await apiClient.put(API_ENDPOINTS.USER_BY_ID(id), userData);
        return response.data.data || response.data;
    },

    /**
     * Delete employee
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(API_ENDPOINTS.USER_BY_ID(id));
    },
};

export default employeesApi;
