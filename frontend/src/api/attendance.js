import api from './axios';

/**
 * Mark attendance for current user
 * @param {Object} data - { longitude, latitude }
 * @returns {Promise} - Created attendance record
 */
export const markAttendance = async (data) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
};

/**
 * Get attendance records (with optional filters)
 * @param {Object} params - Query parameters (page, limit, startDate, endDate, userId, officeId)
 * @returns {Promise} - Attendance records with pagination
 */
export const getAttendance = async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
};

/**
 * Get attendance record by ID
 * @param {string} id - Attendance record ID
 * @returns {Promise} - Single attendance record
 */
export const getAttendanceById = async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
};

/**
 * Check if user has marked attendance today
 * @returns {Promise} - Boolean indicating if attendance is marked
 */
export const checkTodayAttendance = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const response = await getAttendance({
            startDate: today.toISOString(),
            endDate: tomorrow.toISOString(),
            limit: 1,
        });

        return response.data?.records?.length > 0;
    } catch (error) {
        console.error('Error checking today attendance:', error);
        return false;
    }
};

/**
 * Get monthly attendance summary
 * @param {string} month - Month in YYYY-MM format
 * @param {string} officeId - Optional office ID filter (for super admin)
 * @returns {Promise} - Monthly summary with attendance counts
 */
export const getMonthlySummary = async (month, officeId) => {
    const params = { month };
    if (officeId) {
        params.officeId = officeId;
    }
    const response = await api.get('/attendance/summary/monthly', {
        params,
    });
    return response.data;
};
