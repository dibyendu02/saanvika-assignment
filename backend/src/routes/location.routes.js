/**
 * Location Routes
 * Location sharing endpoints (separate from attendance)
 */
import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  shareLocation,
  getLocations,
  getLocationById,
} from '../controllers/location.controller.js';
import {
  shareLocationSchema,
  getLocationsQuerySchema,
  idParamSchema,
  validate,
} from '../validators/location.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Share location (internal and external only)
router.post(
  '/share',
  authorize('internal', 'external'),
  validate(shareLocationSchema),
  shareLocation
);

// Get location records (role-based access)
router.get(
  '/',
  validate(getLocationsQuerySchema, 'query'),
  getLocations
);

// Get location record by ID (role-based access)
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  getLocationById
);

export default router;
