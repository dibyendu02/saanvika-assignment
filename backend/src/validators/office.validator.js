/**
 * Office Validators
 * Joi validation schemas for office routes
 */
import Joi from 'joi';
import AppError from '../utils/AppError.js';

// Custom ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// GeoJSON Point schema
const locationSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array()
    .items(Joi.number())
    .length(2)
    .required()
    .custom((value, helpers) => {
      const [longitude, latitude] = value;
      if (longitude < -180 || longitude > 180) {
        return helpers.error('any.invalid', {
          message: 'Longitude must be between -180 and 180',
        });
      }
      if (latitude < -90 || latitude > 90) {
        return helpers.error('any.invalid', {
          message: 'Latitude must be between -90 and 90',
        });
      }
      return value;
    })
    .messages({
      'array.length': 'Coordinates must be [longitude, latitude]',
      'any.required': 'Coordinates are required',
    }),
});

// Target schema
const targetSchema = Joi.object({
  type: Joi.string()
    .valid('daily', 'monthly', 'yearly')
    .required()
    .messages({
      'any.only': 'Target type must be one of: daily, monthly, yearly',
      'any.required': 'Target type is required',
    }),
  count: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Target count cannot be negative',
      'any.required': 'Target count is required',
    }),
  period: Joi.string()
    .required()
    .messages({
      'any.required': 'Period is required (e.g., "2024-01-15", "2024-01", "2024")',
    }),
});

/**
 * Create office validation schema
 */
export const createOfficeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'string.empty': 'Office name is required',
    'string.min': 'Office name must be at least 2 characters',
    'string.max': 'Office name cannot exceed 200 characters',
    'any.required': 'Office name is required',
  }),

  address: Joi.string().trim().min(5).max(500).required().messages({
    'string.empty': 'Address is required',
    'string.min': 'Address must be at least 5 characters',
    'string.max': 'Address cannot exceed 500 characters',
    'any.required': 'Address is required',
  }),

  location: locationSchema.required().messages({
    'any.required': 'Location is required',
  }),

  targetHeadcount: Joi.number().min(0).optional().default(0).messages({
    'number.min': 'Target headcount cannot be negative',
  }),

  targets: Joi.array().items(targetSchema).optional().default([]),
});

/**
 * Update office validation schema
 */
export const updateOfficeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional().messages({
    'string.min': 'Office name must be at least 2 characters',
    'string.max': 'Office name cannot exceed 200 characters',
  }),

  address: Joi.string().trim().min(5).max(500).optional().messages({
    'string.min': 'Address must be at least 5 characters',
    'string.max': 'Address cannot exceed 500 characters',
  }),

  location: locationSchema.optional(),

  targetHeadcount: Joi.number().min(0).optional().messages({
    'number.min': 'Target headcount cannot be negative',
  }),

  targets: Joi.array().items(targetSchema).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Add target validation schema
 */
export const addTargetSchema = targetSchema;

/**
 * Update target validation schema
 */
export const updateTargetSchema = Joi.object({
  type: Joi.string()
    .valid('daily', 'monthly', 'yearly')
    .required()
    .messages({
      'any.only': 'Target type must be one of: daily, monthly, yearly',
      'any.required': 'Target type is required',
    }),
  period: Joi.string().required().messages({
    'any.required': 'Period is required',
  }),
  count: Joi.number().min(0).required().messages({
    'number.min': 'Target count cannot be negative',
    'any.required': 'New count is required',
  }),
});

/**
 * Office ID param validation schema
 */
export const officeIdSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid office ID format',
    'any.required': 'Office ID is required',
  }),
});

/**
 * Nearby offices query validation schema
 */
export const nearbyOfficesSchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be at least -180',
    'number.max': 'Longitude must be at most 180',
    'any.required': 'Longitude is required',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be at least -90',
    'number.max': 'Latitude must be at most 90',
    'any.required': 'Latitude is required',
  }),
  maxDistance: Joi.number().min(100).max(50000).optional().default(5000).messages({
    'number.min': 'Max distance must be at least 100 meters',
    'number.max': 'Max distance cannot exceed 50000 meters',
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
  createOfficeSchema,
  updateOfficeSchema,
  addTargetSchema,
  updateTargetSchema,
  officeIdSchema,
  nearbyOfficesSchema,
  validate,
};
