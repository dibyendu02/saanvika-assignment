import api from './axios';

/**
 * Get all location records (with optional filters)
 * @param {Object} params - Query parameters (page, limit, userId, officeId, startDate, endDate)
 * @returns {Promise} - Location records with pagination
 */
export const getLocations = async (params = {}) => {
    const response = await api.get('/location', { params });
    return response.data;
};

/**
 * Get location record by ID
 * @param {string} id - Location record ID
 * @returns {Promise} - Single location record
 */
export const getLocationById = async (id) => {
    const response = await api.get(`/location/${id}`);
    return response.data;
};

/**
 * Share current location
 * @param {Object} data - { longitude, latitude, reason }
 * @returns {Promise} - Created location record
 */
export const shareLocation = async (data) => {
    const response = await api.post('/location/share', data);
    return response.data;
};

/**
 * Request location from external employee
 * @param {string} targetUserId - Target User ID
 * @returns {Promise} - Created request
 */
export const requestLocation = async (targetUserId) => {
    const response = await api.post('/location/request', { targetUserId });
    return response.data;
};

/**
 * Get location requests
 * @param {Object} params - Query params
 * @returns {Promise} - List of requests
 */
export const getLocationRequests = async (params = {}) => {
    const response = await api.get('/location/requests', { params });
    return response.data;
};

/**
 * Deny location request
 * @param {string} requestId - Request ID
 * @returns {Promise} - Updated request
 */
export const denyLocationRequest = async (requestId) => {
    const response = await api.patch(`/location/requests/${requestId}/deny`);
    return response.data;
};

/**
 * Delete location record
 * @param {string} id - Location ID
 * @returns {Promise} - Success response
 */
export const deleteLocation = async (id) => {
    const response = await api.delete(`/location/${id}`);
    return response.data;
};

/**
 * Delete location request
 * @param {string} id - Request ID
 * @returns {Promise} - Success response
 */
export const deleteLocationRequest = async (id) => {
    const response = await api.delete(`/location/requests/${id}`);
    return response.data;
};
