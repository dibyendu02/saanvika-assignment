/**
 * API Configuration
 */

// You can change this to your local IP address when testing on physical devices
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
    OFFICES_PUBLIC: '/offices/public',
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
    DISTRIBUTIONS: '/goodies/distributions',
    DISTRIBUTION_BY_ID: (id: string) => `/goodies/distributions/${id}`,
    RECEIVED_GOODIES: '/goodies/received',
    RECEIVED_BY_ID: (id: string) => `/goodies/received/${id}`,
    RECEIVE_GOODIES: '/goodies/receive',

    // Locations
    LOCATIONS: '/location',
    LOCATION_BY_ID: (id: string) => `/location/${id}`,
    LOCATION_SHARE: '/location/share',
    LOCATION_REQUEST: '/location/request',
    LOCATION_REQUESTS: '/location/requests',
    LOCATION_REQUEST_BY_ID: (id: string) => `/location/requests/${id}`,
    APPROVE_LOCATION: (id: string) => `/location/requests/${id}/approve`,
    DENY_LOCATION: (id: string) => `/location/requests/${id}/deny`,

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_BY_ID: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
};

export default {
    API_BASE_URL,
    API_ENDPOINTS,
};
