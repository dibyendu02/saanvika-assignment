/**
 * Location Controller
 * Handles location sharing HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as locationService from '../services/location.service.js';

/**
 * @desc    Share location
 * @route   POST /api/v1/location/share
 * @access  Private (internal, external)
 */
export const shareLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude, reason, requestId } = req.body;

  const location = await locationService.shareLocation(
    req.user,
    longitude,
    latitude,
    reason,
    requestId
  );

  res.status(201).json({
    success: true,
    data: { location },
    message: 'Location shared successfully',
  });
});

/**
 * @desc    Get location records
 * @route   GET /api/v1/location
 * @access  Private (role-based)
 */
export const getLocations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId, officeId, startDate, endDate } = req.query;

  const result = await locationService.getLocations(req.user, {
    page: parseInt(page),
    limit: parseInt(limit),
    userId,
    officeId,
    startDate,
    endDate,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Location records fetched successfully',
  });
});

/**
 * @desc    Get location record by ID
 * @route   GET /api/v1/location/:id
 * @access  Private (role-based)
 */
export const getLocationById = asyncHandler(async (req, res) => {
  const location = await locationService.getLocationById(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { location },
    message: 'Location record fetched successfully',
  });
});

/**
 * @desc    Request external employee's location
 * @route   POST /api/v1/location/request
 * @access  Private (all but external)
 */
export const requestLocation = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  const request = await locationService.requestLocation(req.user, targetUserId);

  res.status(201).json({
    success: true,
    data: { request },
    message: 'Location request sent successfully',
  });
});

/**
 * @desc    Get location requests (sent or received)
 * @route   GET /api/v1/location/requests
 * @access  Private
 */
export const getLocationRequests = asyncHandler(async (req, res) => {
  const { officeId } = req.query;
  const requests = await locationService.getLocationRequests(req.user, { officeId });

  res.status(200).json({
    success: true,
    data: { requests },
    message: 'Location requests fetched successfully',
  });
});

/**
 * @desc    Deny a location request
 * @route   PATCH /api/v1/location/requests/:id/deny
 * @access  Private (external only)
 */
export const denyLocationRequest = asyncHandler(async (req, res) => {
  const request = await locationService.denyLocationRequest(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { request },
    message: 'Location request denied',
  });

});

/**
 * @desc    Delete a location record
 * @route   DELETE /api/v1/location/:id
 * @access  Private (admin, super_admin)
 */
export const deleteLocation = asyncHandler(async (req, res) => {
  await locationService.deleteLocation(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Location record deleted successfully',
  });
});

/**
 * @desc    Delete a location request
 * @route   DELETE /api/v1/location/requests/:id
 * @access  Private (admin, super_admin, requester)
 */
export const deleteLocationRequest = asyncHandler(async (req, res) => {
  await locationService.deleteLocationRequest(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Location request deleted successfully',
  });
});

export default {
  shareLocation,
  requestLocation,
  getLocations,
  getLocationById,
  getLocationRequests,
  getLocationRequests,
  denyLocationRequest,
  deleteLocation,
  deleteLocationRequest,
};
