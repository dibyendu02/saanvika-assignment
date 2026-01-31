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
 * Request an internal or external employee's location
 * @param {Object} requestingUser - The user making the request
 * @param {string} targetUserId - The ID of the employee whose location is requested
 */
export const requestLocation = async (requestingUser, targetUserId) => {
  // Allow admin/super_admin to request location from internal or external employees
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found', 404);
  }


  // Only allow requests to internal or external employees
  if (!['internal', 'external'].includes(targetUser.role)) {
    throw new AppError('Location requests can only be sent to internal or external employees', 400);
  }

  // Only admin or super_admin can request location from internal employees
  if (targetUser.role === 'internal' && !['super_admin', 'admin'].includes(requestingUser.role)) {
    throw new AppError('Only admin or super admin can request location from internal employees', 403);
  }

  // Only internal, admin, or super_admin can request location from external employees
  if (targetUser.role === 'external' && !['internal', 'admin', 'super_admin'].includes(requestingUser.role)) {
    throw new AppError('Only internal, admin, or super admin can request location from external employees', 403);
  }

  // Prevent users from requesting their own location
  if (requestingUser._id.toString() === targetUserId.toString()) {
    throw new AppError('You cannot request your own location', 400);
  }

  // External employees cannot request locations
  if (requestingUser.role === 'external') {
    throw new AppError('External employees cannot request locations', 403);
  }

  const request = await LocationRequest.create({
    requester: requestingUser._id,
    targetUser: targetUserId,
    status: 'pending',
  });

  // Create notification for the target user
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
 * - Internal employees see both requests they sent AND received
 * - Admin/Super admin see requests they sent
 * - Super admin can filter by office
 */
export const getLocationRequests = async (user, filters = {}) => {
  let query;

  if (user.role === 'external') {
    // External employees see requests sent to them
    query = { targetUser: user._id };
  } else if (user.role === 'internal') {
    // Internal employees see both requests they sent AND requests sent to them
    query = {
      $or: [
        { requester: user._id },
        { targetUser: user._id }
      ]
    };
  } else {
    // Admin/Super admin see requests they sent
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

/**
 * Delete a location record
 * @param {Object} requestingUser - The user performing the action
 * @param {string} locationId - ID of location record to delete
 * @returns {Promise<void>}
 */
export const deleteLocation = async (requestingUser, locationId) => {
  const location = await Location.findById(locationId);

  if (!location) {
    throw new AppError('Location record not found', 404);
  }

  // Access control
  if (requestingUser.role === 'super_admin') {
    // Super admin can delete any location record
  } else if (requestingUser.role === 'admin') {
    // Admin can only delete locations for their office
    if (location.officeId?.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to delete this location record', 403);
    }
  } else {
    throw new AppError('You are not authorized to delete location records', 403);
  }

  await Location.findByIdAndDelete(locationId);
};

/**
 * Delete a location request
 * @param {Object} requestingUser - The user performing the action
 * @param {string} requestId - ID of request to delete
 * @returns {Promise<void>}
 */
export const deleteLocationRequest = async (requestingUser, requestId) => {
  const request = await LocationRequest.findById(requestId)
    .populate('requester', 'primaryOfficeId')
    .populate('targetUser', 'primaryOfficeId');

  if (!request) {
    throw new AppError('Location request not found', 404);
  }

  // Access control
  if (requestingUser.role === 'super_admin') {
    // Super admin can delete any request
  } else if (requestingUser.role === 'admin') {
    // Admin can delete requests where either requester OR target is in their office
    const requesterOfficeId = request.requester?.primaryOfficeId?.toString();
    const targetOfficeId = request.targetUser?.primaryOfficeId?.toString();
    const adminOfficeId = requestingUser.primaryOfficeId?.toString();

    if (requesterOfficeId !== adminOfficeId && targetOfficeId !== adminOfficeId) {
      throw new AppError('You are not authorized to delete this request', 403);
    }
  } else {
    // Users can delete their OWN sent requests if pending
    if (request.requester._id.toString() === requestingUser._id.toString()) {
      if (request.status !== 'pending') {
        throw new AppError('Cannot delete a request that has already been responded to', 400);
      }
    } else {
      throw new AppError('You are not authorized to delete this request', 403);
    }
  }

  await LocationRequest.findByIdAndDelete(requestId);
};


export default {
  shareLocation,
  requestLocation,
  getLocations,
  getLocationById,
  getLocationRequests,
  denyLocationRequest,
  deleteLocation,
  deleteLocationRequest,
};
