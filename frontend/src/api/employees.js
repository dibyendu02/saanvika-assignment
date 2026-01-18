/**
 * Employee API
 * Handles employee-related API calls including bulk upload
 */
import api from './axios';

/**
 * Upload employees from Excel file
 * @param {File} file - Excel file
 * @param {string} targetOfficeId - Target office ID (for super admins)
 * @returns {Promise} - Upload result
 */
export const uploadEmployeesExcel = async (file, targetOfficeId = null) => {
    const formData = new FormData();
    formData.append('file', file);

    // Add targetOfficeId if provided (for super admins)
    if (targetOfficeId) {
        formData.append('targetOfficeId', targetOfficeId);
    }

    const response = await api.post('/users/bulk-upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Download employee Excel template
 * @returns {Promise<Blob>} - Excel file blob
 */
export const downloadEmployeeTemplate = async () => {
    const response = await api.get('/users/template', {
        responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
};

/**
 * Get all employees
 * @param {Object} params - Query parameters
 * @returns {Promise} - Employees list
 */
export const getEmployees = async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
};

/**
 * Get employees by office
 * @param {string} officeId - Office ID
 * @param {Object} params - Query parameters
 * @returns {Promise} - Employees list
 */
export const getEmployeesByOffice = async (officeId, params = {}) => {
    const response = await api.get(`/users/office/${officeId}`, { params });
    return response.data;
};

export default {
    uploadEmployeesExcel,
    downloadEmployeeTemplate,
    getEmployees,
    getEmployeesByOffice,
};
