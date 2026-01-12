/**
 * Office Controller
 * Handles office-related HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as officeService from '../services/office.service.js';

/**
 * @desc    Create a new office
 * @route   POST /api/v1/offices
 * @access  Private (admin, super_admin)
 */
export const createOffice = asyncHandler(async (req, res) => {
  const office = await officeService.createOffice(req.body);

  res.status(201).json({
    success: true,
    data: { office },
    message: 'Office created successfully',
  });
});

/**
 * @desc    Get all offices
 * @route   GET /api/v1/offices
 * @access  Private (all authenticated users with access control)
 */
export const getAllOffices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const result = await officeService.getAllOffices(req.user, {
    page: parseInt(page),
    limit: parseInt(limit),
    search,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Offices fetched successfully',
  });
});

/**
 * @desc    Get office by ID
 * @route   GET /api/v1/offices/:id
 * @access  Private (role-based access control)
 */
export const getOfficeById = asyncHandler(async (req, res) => {
  const office = await officeService.getOfficeById(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { office },
    message: 'Office fetched successfully',
  });
});

/**
 * @desc    Update office
 * @route   PUT /api/v1/offices/:id
 * @access  Private (admin, super_admin)
 */
export const updateOffice = asyncHandler(async (req, res) => {
  const office = await officeService.updateOffice(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: { office },
    message: 'Office updated successfully',
  });
});

/**
 * @desc    Delete office
 * @route   DELETE /api/v1/offices/:id
 * @access  Private (super_admin only)
 */
export const deleteOffice = asyncHandler(async (req, res) => {
  await officeService.deleteOffice(req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Office deleted successfully',
  });
});

/**
 * @desc    Add target to office
 * @route   POST /api/v1/offices/:id/targets
 * @access  Private (admin, super_admin)
 */
export const addTarget = asyncHandler(async (req, res) => {
  const office = await officeService.addTarget(req.params.id, req.body);

  res.status(201).json({
    success: true,
    data: { office },
    message: 'Target added successfully',
  });
});

/**
 * @desc    Update target in office
 * @route   PUT /api/v1/offices/:id/targets
 * @access  Private (admin, super_admin)
 */
export const updateTarget = asyncHandler(async (req, res) => {
  const { type, period, count } = req.body;
  const office = await officeService.updateTarget(req.params.id, type, period, count);

  res.status(200).json({
    success: true,
    data: { office },
    message: 'Target updated successfully',
  });
});

/**
 * @desc    Find nearby offices
 * @route   GET /api/v1/offices/nearby
 * @access  Private (all authenticated users)
 */
export const findNearbyOffices = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 5000 } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({
      success: false,
      message: 'Longitude and latitude are required',
    });
  }

  const offices = await officeService.findNearbyOffices(
    parseFloat(longitude),
    parseFloat(latitude),
    parseInt(maxDistance)
  );

  res.status(200).json({
    success: true,
    data: { offices, count: offices.length },
    message: 'Nearby offices fetched successfully',
  });
});

export default {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
  addTarget,
  updateTarget,
  findNearbyOffices,
};
