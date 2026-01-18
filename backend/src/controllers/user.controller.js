/**
 * User Controller
 * Handles user-related HTTP requests with access control
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import AppError from '../utils/AppError.js';


/**
 * @desc    Get current user's profile
 * @route   GET /api/v1/users/profile
 * @access  Private (all authenticated users)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Profile fetched successfully',
  });
});

/**
 * @desc    Get all users (with role-based filtering)
 * @route   GET /api/v1/users
 * @access  Private (super_admin, admin: all users; internal: same office; external: forbidden)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  const result = await userService.getUsersByRole(req.user, role, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Users fetched successfully',
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private (role-based access control)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user, req.params.id);

  res.status(200).json({
    success: true,
    data: { user },
    message: 'User fetched successfully',
  });
});

/**
 * @desc    Get employees by office
 * @route   GET /api/v1/users/office/:officeId
 * @access  Private (super_admin, admin: any office; internal: own office; external: forbidden)
 */
export const getEmployeesByOffice = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await userService.getEmployeesByOffice(
    req.user,
    req.params.officeId,
    { page: parseInt(page), limit: parseInt(limit) }
  );

  res.status(200).json({
    success: true,
    data: result,
    message: 'Employees fetched successfully',
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/v1/users/profile
 * @access  Private (all authenticated users)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateMyProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Profile updated successfully',
  });
});

/**
 * @desc    Bulk upload employees from Excel file
 * @route   POST /api/v1/users/bulk-upload
 * @access  Private (admin, super_admin)
 */
export const bulkUploadEmployees = asyncHandler(async (req, res) => {
  const fs = await import('fs');
  const excelService = await import('../services/excel.service.js');

  if (!req.file) {
    throw new AppError('Please upload an Excel file', 400);
  }

  try {
    // Parse Excel file
    const { employees, errors: parseErrors } = await excelService.parseEmployeeExcel(req.file.path);

    // Create employees
    const results = await userService.bulkCreateEmployees(req.user, employees);

    // Combine parse errors with creation errors
    const allErrors = [...parseErrors, ...results.failed];

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      data: {
        totalProcessed: results.totalProcessed + parseErrors.length,
        successCount: results.success.length,
        failedCount: allErrors.length,
        successRecords: results.success,
        failedRecords: allErrors,
      },
      message: `Bulk upload completed. ${results.success.length} employees created successfully, ${allErrors.length} failed.`,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

/**
 * @desc    Download employee Excel template
 * @route   GET /api/v1/users/template
 * @access  Private (admin, super_admin)
 */
export const downloadTemplate = asyncHandler(async (req, res) => {
  const excelService = await import('../services/excel.service.js');

  const buffer = excelService.generateExcelTemplate();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=employee-template.xlsx');
  res.send(buffer);
});


export default {
  getProfile,
  getAllUsers,
  getUserById,
  getEmployeesByOffice,
  updateProfile,
  bulkUploadEmployees,
  downloadTemplate,
};

