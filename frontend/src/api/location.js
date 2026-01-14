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
