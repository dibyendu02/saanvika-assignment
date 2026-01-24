/**
 * Location Service
 * Handles location sharing business logic
 * NOTE: This does NOT create attendance records and does NOT enforce office radius
 */
import Location from '../models/location.model.js';
import LocationRequest from '../models/locationRequest.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.utils.js';
import * as notificationService from './notification.service.js';

/**
 * Share location (does not enforce office proximity)
 * @param {Object} requestingUser - The user sharing location
 * @param {number} longitude - User's current longitude
 * @param {number} latitude - User's current latitude
 * @param {string} reason - Optional reason for sharing location
 * @returns {Promise<Object>} - Created location record
 */
export const shareLocation = async (requestingUser, longitude, latitude, reason, requestId) => {
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

  // If this was shared in response to a request
  if (requestId) {
    const request = await LocationRequest.findById(requestId);
    if (request && request.targetUser.toString() === requestingUser._id.toString()) {
      request.status = 'shared';
      request.respondedAt = new Date();
      request.locationId = locationRecord._id;
      await request.save();

      // Notify the requester
      await notificationService.createNotification({
        recipient: request.requester,
        sender: requestingUser._id,
        title: 'Location Shared',
        message: `${requestingUser.name} has shared their location in response to your request.`,
        type: 'location_shared',
        relatedId: locationRecord._id,
      });
    }
  }

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
  if (requestingUser.role === 'super_admin') {
    // Super admin can see all location records, with optional filters
    if (officeId) {
      query.officeId = officeId;
    }
    if (userId) {
      query.userId = userId;
    }
  } else if (requestingUser.role === 'admin') {
    // Admin can only see locations from their own office
    query.officeId = requestingUser.primaryOfficeId;
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
  if (requestingUser.role === 'super_admin') {
    return location;
  }

  if (requestingUser.role === 'admin') {
    // Admin can only see locations from their office
    if (location.officeId?._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this location record', 403);
    }
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

/**
 * Request an external employee's location
 * @param {Object} requestingUser - The user making the request
 * @param {string} targetUserId - The ID of the employee whose location is requested
 */
export const requestLocation = async (requestingUser, targetUserId) => {
  // Check if target user is external
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found', 404);
  }

  if (targetUser.role !== 'external') {
    throw new AppError('Location requests can only be sent to external employees', 400);
  }

  // Check if requesting user is allowed to request (anyone but external)
  if (requestingUser.role === 'external') {
    throw new AppError('External employees cannot request locations', 403);
  }

  const request = await LocationRequest.create({
    requester: requestingUser._id,
    targetUser: targetUserId,
    status: 'pending',
  });

  // Create notification for external employee
  await notificationService.createNotification({
    recipient: targetUserId,
    sender: requestingUser._id,
    title: 'Location Request',
    message: `${requestingUser.name} is requesting your current location.`,
    type: 'location_request',
    relatedId: request._id,
  });

  return request;
};

/**
 * Get location requests for a user
 * - External employees see requests they received
 * - Others see requests they sent
 * - Super admin can filter by office
 */
export const getLocationRequests = async (user, filters = {}) => {
  let query;

  if (user.role === 'external') {
    // External employees see requests sent to them
    query = { targetUser: user._id };
  } else {
    // Others see requests they sent
    query = { requester: user._id };
  }

  const requests = await LocationRequest.find(query)
    .populate('requester', 'name email role primaryOfficeId')
    .populate('targetUser', 'name email role primaryOfficeId')
    .populate('locationId')
    .sort({ requestedAt: -1 });

  // Filter by office if super admin and officeId provided
  if (user.role === 'super_admin' && filters.officeId) {
    return requests.filter(request => {
      const targetOfficeId = request.targetUser?.primaryOfficeId?._id || request.targetUser?.primaryOfficeId;
      const requesterOfficeId = request.requester?.primaryOfficeId?._id || request.requester?.primaryOfficeId;
      return targetOfficeId?.toString() === filters.officeId || requesterOfficeId?.toString() === filters.officeId;
    });
  }

  return requests;
};

/**
 * Deny a location request
 */
export const denyLocationRequest = async (user, requestId) => {
  const request = await LocationRequest.findById(requestId);

  if (!request) {
    throw new AppError('Location request not found', 404);
  }

  // Only the target user can deny
  if (request.targetUser.toString() !== user._id.toString()) {
    throw new AppError('You are not authorized to deny this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError('This request has already been responded to', 400);
  }

  request.status = 'denied';
  request.respondedAt = new Date();
  await request.save();

  // Notify the requester (non-blocking)
  try {
    await notificationService.createNotification({
      recipient: request.requester,
      sender: user._id,
      title: 'Location Request Denied',
      message: `${user.name} has denied your location request.`,
      type: 'location_denied',
      relatedId: request._id,
    });
  } catch (error) {
    // Log but don't fail the deny operation
    console.error('Failed to create notification:', error);
  }

  return request;
};

export default {
  shareLocation,
  requestLocation,
  getLocations,
  getLocationById,
  getLocationRequests,
  denyLocationRequest,
};
