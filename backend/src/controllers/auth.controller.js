/**
 * Auth Controller
 * Handles authentication HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
    message: 'Registration successful',
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.loginUser(email, password);

  res.status(200).json({
    success: true,
    data: {
      user,
      token,
    },
    message: 'Login successful',
  });
});

/**
 * @desc    Verify external employee
 * @route   POST /api/v1/auth/verify/:externalEmployeeId
 * @access  Private (internal, admin, super_admin)
 */
export const verifyEmployee = asyncHandler(async (req, res) => {
  const { externalEmployeeId } = req.params;
  const internalEmployeeId = req.user._id;

  const user = await authService.verifyExternalEmployee(
    internalEmployeeId,
    externalEmployeeId
  );

  res.status(200).json({
    success: true,
    data: {
      user,
    },
    message: 'Employee verified successfully',
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
    message: 'User fetched successfully',
  });
});

/**
 * @desc    Create employee (by internal, admin, super_admin)
 * @route   POST /api/v1/auth/employees
 * @access  Private (internal, admin, super_admin)
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const user = await authService.createEmployee(req.user, req.body);

  res.status(201).json({
    success: true,
    data: {
      user,
    },
    message: 'Employee created successfully',
  });
});

export default {
  register,
  login,
  verifyEmployee,
  getMe,
  createEmployee,
};
