/**
 * User Controller
 * Handles user-related HTTP requests with access control
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

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

export default {
  getProfile,
  getAllUsers,
  getUserById,
  getEmployeesByOffice,
  updateProfile,
};
