/**
 * Attendance Validators
 * Joi validation schemas for attendance routes
 */
import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Mark attendance validation schema
 */
export const markAttendanceSchema = Joi.object({
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be at least -180',
      'number.max': 'Longitude must be at most 180',
      'any.required': 'Longitude is required',
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be at least -90',
      'number.max': 'Latitude must be at most 90',
      'any.required': 'Latitude is required',
    }),
});

/**
 * Get attendance query validation schema
 */
export const getAttendanceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),

  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be a valid ISO date',
  }),

  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be a valid ISO date',
  }),

  officeId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid office ID format',
  }),

  userId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid user ID format',
  }),
});

/**
 * Attendance ID param validation schema
 */
export const attendanceIdSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid attendance ID format',
    'any.required': 'Attendance ID is required',
  }),
});

/**
 * Monthly summary query validation schema
 */
export const monthlySummarySchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format (e.g., 2026-01)',
      'any.required': 'Month parameter is required',
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

    req[source] = value;
    next();
  };
};

export default {
  markAttendanceSchema,
  getAttendanceQuerySchema,
  attendanceIdSchema,
  monthlySummarySchema,
  validate,
};
