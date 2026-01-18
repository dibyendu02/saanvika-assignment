/**
 * Goodies Controller
 * Handles goodies distribution and receiving HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as goodiesService from '../services/goodies.service.js';

/**
 * @desc    Create goodies distribution
 * @route   POST /api/v1/goodies/distributions
 * @access  Private (admin, super_admin)
 */
export const createDistribution = asyncHandler(async (req, res) => {
  const distribution = await goodiesService.createDistribution(req.user, req.body);

  res.status(201).json({
    success: true,
    data: { distribution },
    message: 'Distribution created successfully',
  });
});

/**
 * @desc    Get all distributions
 * @route   GET /api/v1/goodies/distributions
 * @access  Private (role-based)
 */
export const getDistributions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, officeId, startDate, endDate } = req.query;

  const result = await goodiesService.getDistributions(req.user, {
    page: parseInt(page),
    limit: parseInt(limit),
    officeId,
    startDate,
    endDate,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Distributions fetched successfully',
  });
});

/**
 * @desc    Get distribution by ID
 * @route   GET /api/v1/goodies/distributions/:id
 * @access  Private (role-based)
 */
export const getDistributionById = asyncHandler(async (req, res) => {
  const distribution = await goodiesService.getDistributionById(
    req.user,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: { distribution },
    message: 'Distribution fetched successfully',
  });
});

/**
 * @desc    Receive goodies
 * @route   POST /api/v1/goodies/receive
 * @access  Private (internal, external)
 */
export const receiveGoodies = asyncHandler(async (req, res) => {
  const { distributionId } = req.body;

  const receipt = await goodiesService.receiveGoodies(req.user, distributionId);

  res.status(201).json({
    success: true,
    data: { receipt },
    message: 'Goodies received successfully',
  });
});

/**
 * @desc    Get received goodies records
 * @route   GET /api/v1/goodies/received
 * @access  Private (role-based)
 */
export const getReceivedGoodies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, officeId, userId, distributionId, startDate, endDate } = req.query;

  const result = await goodiesService.getReceivedGoodies(req.user, {
    page: parseInt(page),
    limit: parseInt(limit),
    officeId,
    userId,
    distributionId,
    startDate,
    endDate,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Received goodies fetched successfully',
  });
});

/**
 * @desc    Get received record by ID
 * @route   GET /api/v1/goodies/received/:id
 * @access  Private (role-based)
 */
export const getReceivedById = asyncHandler(async (req, res) => {
  const record = await goodiesService.getReceivedById(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { record },
    message: 'Receipt record fetched successfully',
  });
});

/**
 * @desc    Get eligible employees for a distribution
 * @route   GET /api/v1/goodies/distributions/:id/eligible-employees
 * @access  Private (admin, super_admin, internal)
 */
export const getEligibleEmployees = asyncHandler(async (req, res) => {
  const employees = await goodiesService.getEligibleEmployees(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { employees, count: employees.length },
    message: 'Eligible employees fetched successfully',
  });
});

export default {
  createDistribution,
  getDistributions,
  getDistributionById,
  receiveGoodies,
  getReceivedGoodies,
  getReceivedById,
  getEligibleEmployees,
};
