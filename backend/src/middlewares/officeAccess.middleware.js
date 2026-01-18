/**
 * Office Access Middleware
 * Provides middleware functions for office-based access control
 */
import AppError from '../utils/AppError.js';

/**
 * Get the office ID(s) that a user has access to
 * @param {Object} user - The authenticated user
 * @returns {Object} - { officeIds: Array, isSuperAdmin: boolean }
 */
export const getUserOfficeAccess = (user) => {
    // Super admins have access to all offices
    if (user.role === 'super_admin') {
        return { officeIds: null, isSuperAdmin: true }; // null means all offices
    }

    // Admins have access only to their assigned office
    if (user.role === 'admin') {
        if (!user.assignedOfficeId) {
            throw new AppError('Admin user must have an assigned office', 403);
        }
        return { officeIds: [user.assignedOfficeId], isSuperAdmin: false };
    }

    // Internal and external employees have access to their primary office
    if (['internal', 'external'].includes(user.role)) {
        if (!user.primaryOfficeId) {
            throw new AppError('Employee must have a primary office', 403);
        }
        return { officeIds: [user.primaryOfficeId], isSuperAdmin: false };
    }

    throw new AppError('Invalid user role', 403);
};

/**
 * Check if user has access to a specific office
 * @param {Object} user - The authenticated user
 * @param {string} officeId - The office ID to check access for
 * @returns {boolean} - True if user has access
 */
export const hasOfficeAccess = (user, officeId) => {
    const { officeIds, isSuperAdmin } = getUserOfficeAccess(user);

    // Super admins have access to all offices
    if (isSuperAdmin) {
        return true;
    }

    // Check if officeId is in user's accessible offices
    return officeIds.some(id => id.toString() === officeId.toString());
};

/**
 * Middleware to check office access for a specific office ID
 * Expects req.params.officeId or req.body.officeId or req.query.officeId
 */
export const checkOfficeAccess = (req, res, next) => {
    try {
        const officeId = req.params.officeId || req.body.officeId || req.query.officeId;

        if (!officeId) {
            return next(new AppError('Office ID is required', 400));
        }

        if (!hasOfficeAccess(req.user, officeId)) {
            return next(new AppError('You do not have access to this office', 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to filter query by user's accessible offices
 * Adds officeFilter to req object for use in controllers
 */
export const addOfficeFilter = (req, res, next) => {
    try {
        const { officeIds, isSuperAdmin } = getUserOfficeAccess(req.user);

        // Super admins can see all offices (no filter)
        if (isSuperAdmin) {
            req.officeFilter = {};
        } else {
            // Other users can only see their accessible offices
            req.officeFilter = { officeId: { $in: officeIds } };
        }

        // Store office access info for use in controllers
        req.userOfficeAccess = { officeIds, isSuperAdmin };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to ensure only super admins can access
 */
export const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return next(new AppError('Only super admins can perform this action', 403));
    }
    next();
};

/**
 * Middleware to ensure only admins or super admins can access
 */
export const requireAdminOrSuperAdmin = (req, res, next) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
        return next(new AppError('Only admins or super admins can perform this action', 403));
    }
    next();
};

export default {
    getUserOfficeAccess,
    hasOfficeAccess,
    checkOfficeAccess,
    addOfficeFilter,
    requireSuperAdmin,
    requireAdminOrSuperAdmin,
};
