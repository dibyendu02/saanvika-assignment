/**
 * Auth Service
 * Handles authentication business logic
 */
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<{user: Object, token: string}>}
 */
export const registerUser = async (userData) => {
  const { email, phone } = userData;

  // Check for existing user with same email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new AppError('Email already registered', 409);
  }

  // Check for existing user with same phone if provided
  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError('Phone number already registered', 409);
    }
  } else {
    delete userData.phone;
  }

  // Create user (status is set by pre-save hook based on role)
  const user = await User.create(userData);

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: Object, token: string}>}
 */
export const loginUser = async (email, password) => {
  // Find user by email and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError(
      'Account is not active. Please wait for verification.',
      401
    );
  }

  // Compare passwords
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

/**
 * Verify external employee by internal/admin user
 * @param {string} internalEmployeeId - ID of the verifying user
 * @param {string} externalEmployeeId - ID of the external employee to verify
 * @returns {Promise<Object>} - Updated user object
 */
export const verifyExternalEmployee = async (
  internalEmployeeId,
  externalEmployeeId
) => {
  // Check if internal employee exists and has proper role
  const internalEmployee = await User.findById(internalEmployeeId);
  if (!internalEmployee) {
    throw new AppError('Verifying user not found', 404);
  }

  if (!['internal', 'admin', 'super_admin'].includes(internalEmployee.role)) {
    throw new AppError(
      'Only internal employees, admins, or super admins can verify external employees',
      403
    );
  }

  // Check if external employee exists
  const externalEmployee = await User.findById(externalEmployeeId);
  if (!externalEmployee) {
    throw new AppError('External employee not found', 404);
  }

  // Check if external employee is pending
  if (externalEmployee.status !== 'pending') {
    throw new AppError(
      `Employee is already ${externalEmployee.status}`,
      400
    );
  }

  // Update external employee status
  externalEmployee.status = 'active';
  externalEmployee.verifiedBy = internalEmployeeId;
  externalEmployee.verifiedAt = new Date();

  await externalEmployee.save();

  return externalEmployee;
};

/**
 * Create employee by authorized user (internal, admin, super_admin)
 * External employees created this way are auto-activated
 * @param {Object} creatorUser - The user creating the employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} - Created user object
 */
export const createEmployee = async (creatorUser, employeeData) => {
  const { email, phone } = employeeData;

  // Check for existing user with same email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new AppError('Email already registered', 409);
  }

  // Check for existing user with same phone if provided
  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError('Phone number already registered', 409);
    }
  } else {
    delete employeeData.phone;
  }

  // Set createdBy to auto-activate external employees
  const userData = {
    ...employeeData,
    createdBy: creatorUser._id,
  };

  // Create user (status is set by pre-save hook)
  const user = await User.create(userData);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

export default {
  registerUser,
  loginUser,
  verifyExternalEmployee,
  createEmployee,
};
