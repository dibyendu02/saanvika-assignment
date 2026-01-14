/**
 * Location Validators
 * Joi validation schemas for location routes
 */
import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Share location validation schema
 */
export const shareLocationSchema = Joi.object({
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required',
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required',
    }),

  reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters',
    }),
});

/**
 * Get locations query validation schema
 */
export const getLocationsQuerySchema = Joi.object({
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

  userId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid user ID format',
  }),

  officeId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid office ID format',
  }),

  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be a valid ISO date',
  }),

  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be a valid ISO date',
  }),
});

/**
 * ID param validation schema
 */
export const idParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid ID format',
    'any.required': 'ID is required',
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
  shareLocationSchema,
  getLocationsQuerySchema,
  idParamSchema,
  validate,
};
