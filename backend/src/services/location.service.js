/**
 * Location Service
 * Handles location sharing business logic
 * NOTE: This does NOT create attendance records and does NOT enforce office radius
 */
import Location from '../models/location.model.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.utils.js';

/**
 * Share location (does not enforce office proximity)
 * @param {Object} requestingUser - The user sharing location
 * @param {number} longitude - User's current longitude
 * @param {number} latitude - User's current latitude
 * @param {string} reason - Optional reason for sharing location
 * @returns {Promise<Object>} - Created location record
 */
export const shareLocation = async (requestingUser, longitude, latitude, reason) => {
  // Business rule: Only internal and external employees can share location
  if (!['internal', 'external'].includes(requestingUser.role)) {
    throw new AppError('Only employees can share location', 403);
  }

  const locationRecord = await Location.create({
    userId: requestingUser._id,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    sharedAt: new Date(),
    reason: reason || undefined,
    officeId: requestingUser.primaryOfficeId,
  });

  return locationRecord;
};

/**
 * Get location records with role-based access control
 * @param {Object} requestingUser - The user making the request
 * @param {Object} filters - Query filters
 * @returns {Promise<{records: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getLocations = async (requestingUser, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { userId, officeId, startDate, endDate } = filters;

  let query = {};

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Admin and super_admin can see all location records, with optional filters
    if (officeId) {
      query.officeId = officeId;
    }
    if (userId) {
      query.userId = userId;
    }
  } else if (requestingUser.role === 'internal') {
    // Internal can only see locations from their office
    query.officeId = requestingUser.primaryOfficeId;
  } else if (requestingUser.role === 'external') {
    // External can only see their own location history
    query.userId = requestingUser._id;
  } else {
    throw new AppError('You are not authorized to view location records', 403);
  }

  // Date range filter
  if (startDate || endDate) {
    query.sharedAt = {};
    if (startDate) {
      query.sharedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.sharedAt.$lte = new Date(endDate);
    }
  }

  const [records, total] = await Promise.all([
    Location.find(query)
      .populate('userId', 'name email role')
      .populate('officeId', 'name address')
      .skip(skip)
      .limit(limit)
      .sort({ sharedAt: -1 }),
    Location.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    records,
    ...pagination,
  };
};

/**
 * Get location record by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} locationId - Location record ID
 * @returns {Promise<Object>} - Location record
 */
export const getLocationById = async (requestingUser, locationId) => {
  const location = await Location.findById(locationId)
    .populate('userId', 'name email role primaryOfficeId')
    .populate('officeId', 'name address');

  if (!location) {
    throw new AppError('Location record not found', 404);
  }

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return location;
  }

  if (requestingUser.role === 'internal') {
    if (location.officeId?._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this location record', 403);
    }
    return location;
  }

  if (requestingUser.role === 'external') {
    if (location.userId._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('You are not authorized to view this location record', 403);
    }
    return location;
  }

  throw new AppError('Access denied', 403);
};

export default {
  shareLocation,
  getLocations,
  getLocationById,
};
