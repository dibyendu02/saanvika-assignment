/**
 * Auth Validators
 * Joi validation schemas for authentication routes
 */
import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Register validation schema
 */
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
  }),

  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),

  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 100 characters',
    'any.required': 'Password is required',
  }),

  role: Joi.string()
    .valid('super_admin', 'admin', 'internal', 'external')
    .default('external')
    .messages({
      'any.only': 'Role must be one of: super_admin, admin, internal, external',
    }),

  primaryOfficeId: Joi.string()
    .pattern(objectIdPattern)
    .when('role', {
      is: Joi.string().valid('internal', 'external'),
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, ''),
    })
    .messages({
      'string.pattern.base': 'Invalid office ID format',
      'any.required': 'Primary office ID is required for internal and external employees',
    }),

  employeeId: Joi.string().trim().optional().messages({
    'string.empty': 'Employee ID cannot be empty',
  }),

  age: Joi.number().integer().min(18).max(100).optional().messages({
    'number.min': 'Age must be at least 18',
    'number.max': 'Age cannot exceed 100',
  }),

  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Gender must be one of: male, female, other',
  }),

  createdBy: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid creator ID format',
  }),

  dob: Joi.date().optional().messages({
    'date.base': 'Date of birth must be a valid date',
  }),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

/**
 * Verify employee validation schema (params)
 */
export const verifyEmployeeSchema = Joi.object({
  externalEmployeeId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.empty': 'External employee ID is required',
      'string.pattern.base': 'Invalid employee ID format',
      'any.required': 'External employee ID is required',
    }),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      throw new AppError(errorMessages.join(', '), 400);
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

export default {
  registerSchema,
  loginSchema,
  verifyEmployeeSchema,
  validate,
};
