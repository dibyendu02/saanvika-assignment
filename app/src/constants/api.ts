/**
 * API Configuration
 */

// You can change this to your local IP address when testing on physical devices
// Example: 'http://192.168.1.100:5001/api/v1' 192.168.29.96
export const API_BASE_URL = 'http://192.168.29.96:5001/api/v1';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',

    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    DASHBOARD_SUMMARY: '/dashboard/summary',

    // Offices
    OFFICES: '/offices',
    OFFICE_BY_ID: (id: string) => `/offices/${id}`,
    OFFICE_TARGETS: (id: string) => `/offices/${id}/targets`,

    // Users/Employees
    USERS: '/users',
    USER_BY_ID: (id: string) => `/users/${id}`,
    USERS_BY_OFFICE: (officeId: string) => `/users/office/${officeId}`,
    BULK_UPLOAD: '/users/bulk-upload',
    USER_TEMPLATE: '/users/template',

    // Attendance
    ATTENDANCE: '/attendance',
    ATTENDANCE_TODAY: '/attendance/today',
    MARK_ATTENDANCE: '/attendance/mark',

    // Goodies
    GOODIES: '/goodies',
    GOODIE_BY_ID: (id: string) => `/goodies/${id}`,

    // Locations
    LOCATIONS: '/locations',
    LOCATION_REQUESTS: '/locations/requests',
    APPROVE_LOCATION: (id: string) => `/locations/requests/${id}/approve`,
    DENY_LOCATION: (id: string) => `/locations/requests/${id}/deny`,

    // Notifications
    NOTIFICATIONS: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
};

export default {
    API_BASE_URL,
    API_ENDPOINTS,
};
