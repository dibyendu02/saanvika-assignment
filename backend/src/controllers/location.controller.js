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
  const { longitude, latitude, reason } = req.body;

  const location = await locationService.shareLocation(
    req.user,
    longitude,
    latitude,
    reason
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

export default {
  shareLocation,
  getLocations,
  getLocationById,
};
