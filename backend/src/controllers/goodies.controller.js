/**
 * Goodies Controller
 * Handles goodies distribution and receiving HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as goodiesService from '../services/goodies.service.js';
import AppError from '../utils/AppError.js';

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

/**
 * @desc    Bulk upload distributions from Excel
 * @route   POST /api/v1/goodies/bulk-upload
 * @access  Private (admin, super_admin)
 */
export const bulkUploadDistributions = asyncHandler(async (req, res) => {
  const fs = await import('fs');
  const excelService = await import('../services/excel.service.js');

  if (!req.file) {
    throw new AppError('Please upload an Excel file', 400);
  }

  const { goodiesType, distributionDate, totalQuantityPerEmployee = 1 } = req.body;

  if (!goodiesType || !distributionDate) {
    throw new AppError('Goodies type and distribution date are required', 400);
  }

  let filePath = req.file.path;

  try {
    const { items, errors: parseErrors } = await excelService.parseGoodiesExcel(filePath, req.user);

    if (items.length === 0 && parseErrors.length === 0) {
      throw new AppError('No valid employees found in the Excel file', 400);
    }

    const results = await goodiesService.bulkCreateDistribution(req.user, {
      items,
      goodiesType,
      distributionDate,
      totalQuantityPerEmployee: parseInt(totalQuantityPerEmployee)
    });

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Format response to match frontend expectations
    const failedRecords = [
      ...parseErrors.map(err => ({
        row: err.row,
        error: err.error
      })),
      ...results.failed.map(fail => ({
        office: fail.office,
        error: fail.error
      }))
    ];

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: items.length,
        successCount: results.success.length,
        failedCount: results.failed.length + parseErrors.length,
        successRecords: results.success,
        failedRecords: failedRecords,
        parseErrors: parseErrors
      },
      message: results.success.length > 0
        ? `Successfully created distributions for ${results.success.length} office(s).`
        : 'No distributions were created.',
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

/**
 * @desc    Delete a goodies distribution
 * @route   DELETE /api/v1/goodies/distributions/:id
 * @access  Private (admin, super_admin)
 */
export const deleteDistribution = asyncHandler(async (req, res) => {
  await goodiesService.deleteDistribution(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Distribution deleted successfully',
  });
});

/**
 * @desc    Delete a received goodies record
 * @route   DELETE /api/v1/goodies/received/:id
 * @access  Private (admin, super_admin)
 */
export const deleteReceivedRecord = asyncHandler(async (req, res) => {
  await goodiesService.deleteReceivedRecord(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Received record deleted successfully',
  });
});

/**
 * @desc    Manually mark a claim for an employee
 * @route   POST /api/v1/goodies/distributions/:id/mark-claim
 * @access  Private (admin, super_admin)
 */
export const markClaimForEmployee = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const receipt = await goodiesService.markClaimForEmployee(
    req.user,
    req.params.id,
    userId
  );

  res.status(201).json({
    success: true,
    data: { receipt },
    message: 'Claim marked successfully',
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
  bulkUploadDistributions,
  deleteDistribution,
  deleteReceivedRecord,
  markClaimForEmployee,
};
