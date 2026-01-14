/**
 * User Service
 * Handles user-related business logic with role-based access control
 */
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import {
  parsePagination,
  buildPaginationMeta,
  buildSearchQuery,
  mergeSearchQuery,
} from '../utils/pagination.utils.js';

/**
 * Get users filtered by role with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} targetRole - Role to filter by (optional)
 * @param {Object} filters - Pagination and search filters { page, limit, search }
 * @returns {Promise<{users: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getUsersByRole = async (requestingUser, targetRole, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { search } = filters;

  let query = {};

  // Access control based on requesting user's role
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Super admin and admin can see all users
    if (targetRole) {
      query.role = targetRole;
    }
  } else if (requestingUser.role === 'internal') {
    // Internal can only see users from their office
    if (targetRole && ['admin', 'super_admin'].includes(targetRole)) {
      throw new AppError('You are not authorized to view admin users', 403);
    }

    query.primaryOfficeId = requestingUser.primaryOfficeId;

    if (targetRole) {
      query.role = targetRole;
    } else {
      // If no role specified, show only internal and external from same office
      query.role = { $in: ['internal', 'external'] };
    }
  } else if (requestingUser.role === 'external') {
    throw new AppError('You are not authorized to list users', 403);
  }

  // Add search query if provided
  const searchQuery = buildSearchQuery(search, ['name', 'email']);
  query = mergeSearchQuery(query, searchQuery);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('primaryOfficeId', 'name address')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    users,
    ...pagination,
  };
};

/**
 * Get user by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} targetUserId - ID of the user to fetch
 * @returns {Promise<Object>} - User object
 */
export const getUserById = async (requestingUser, targetUserId) => {
  const targetUser = await User.findById(targetUserId)
    .select('-password')
    .populate('primaryOfficeId', 'name address')
    .populate('createdBy', 'name email')
    .populate('verifiedBy', 'name email');

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Access control based on requesting user's role
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Super admin and admin can see any user
    return targetUser;
  }

  if (requestingUser.role === 'internal') {
    // Internal can see users from their office only
    if (
      targetUser.primaryOfficeId &&
      targetUser.primaryOfficeId._id.toString() ===
        requestingUser.primaryOfficeId.toString()
    ) {
      return targetUser;
    }
    throw new AppError('You are not authorized to view this user', 403);
  }

  if (requestingUser.role === 'external') {
    // External can only see their own data
    if (targetUserId.toString() === requestingUser._id.toString()) {
      return targetUser;
    }
    throw new AppError('You are not authorized to view this user', 403);
  }

  throw new AppError('Access denied', 403);
};

/**
 * Get employees by office with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} officeId - Office ID to filter by
 * @param {Object} filters - Pagination and search filters { page, limit, search }
 * @returns {Promise<{employees: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getEmployeesByOffice = async (requestingUser, officeId, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { search } = filters;

  // Access control based on requesting user's role
  if (requestingUser.role === 'external') {
    throw new AppError('You are not authorized to view office employees', 403);
  }

  if (requestingUser.role === 'internal') {
    // Internal can only see employees from their own office
    if (officeId.toString() !== requestingUser.primaryOfficeId.toString()) {
      throw new AppError('You are not authorized to view employees from this office', 403);
    }
  }

  // Super admin and admin can see employees from any office
  let query = { primaryOfficeId: officeId };

  // Add search query if provided
  const searchQuery = buildSearchQuery(search, ['name', 'email']);
  query = mergeSearchQuery(query, searchQuery);

  const [employees, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('primaryOfficeId', 'name address')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    employees,
    ...pagination,
  };
};

/**
 * Get current user's profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User object
 */
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('primaryOfficeId', 'name address')
    .populate('createdBy', 'name email')
    .populate('verifiedBy', 'name email');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Update user profile (self-update)
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update (limited fields)
 * @returns {Promise<Object>} - Updated user object
 */
export const updateMyProfile = async (userId, updateData) => {
  // Only allow updating certain fields
  const allowedFields = ['name', 'phone'];
  const filteredData = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    filteredData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export default {
  getUsersByRole,
  getUserById,
  getEmployeesByOffice,
  getMyProfile,
  updateMyProfile,
};
