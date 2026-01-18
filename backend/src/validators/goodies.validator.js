/**
 * Goodies Validators
 * Joi validation schemas for goodies routes
 */
import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Create distribution validation schema
 */
export const createDistributionSchema = Joi.object({
  officeId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid office ID format',
      'any.required': 'Office ID is required',
    }),

  goodiesType: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Goodies type is required',
      'string.min': 'Goodies type must be at least 2 characters',
      'string.max': 'Goodies type cannot exceed 100 characters',
      'any.required': 'Goodies type is required',
    }),

  distributionDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Distribution date must be a valid ISO date',
      'any.required': 'Distribution date is required',
    }),

  totalQuantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Total quantity must be a number',
      'number.integer': 'Total quantity must be an integer',
      'number.min': 'Total quantity must be at least 1',
      'any.required': 'Total quantity is required',
    }),

  isForAllEmployees: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isForAllEmployees must be a boolean',
    }),

  targetEmployees: Joi.array()
    .items(Joi.string().pattern(objectIdPattern).messages({
      'string.pattern.base': 'Invalid employee ID format',
    }))
    .default([])
    .messages({
      'array.base': 'targetEmployees must be an array',
    }),
});

/**
 * Receive goodies validation schema
 */
export const receiveGoodiesSchema = Joi.object({
  distributionId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid distribution ID format',
      'any.required': 'Distribution ID is required',
    }),
});

/**
 * Get distributions query validation schema
 */
export const getDistributionsQuerySchema = Joi.object({
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
 * Get received goodies query validation schema
 */
export const getReceivedQuerySchema = Joi.object({
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

  officeId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid office ID format',
  }),

  userId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid user ID format',
  }),

  distributionId: Joi.string().pattern(objectIdPattern).optional().messages({
    'string.pattern.base': 'Invalid distribution ID format',
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
  createDistributionSchema,
  receiveGoodiesSchema,
  getDistributionsQuerySchema,
  getReceivedQuerySchema,
  idParamSchema,
  validate,
};
