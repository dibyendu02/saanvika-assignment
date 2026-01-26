/**
 * Location Routes
 * Location sharing endpoints (separate from attendance)
 */
import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  shareLocation,
  requestLocation,
  getLocations,
  getLocationById,
  getLocationRequests,
  denyLocationRequest,
  deleteLocation,
  deleteLocationRequest,
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

// Request location (all but external)
router.post(
  '/request',
  authorize('super_admin', 'admin', 'internal'),
  requestLocation
);

// Get location records (role-based access)
router.get(
  '/',
  validate(getLocationsQuerySchema, 'query'),
  getLocations
);

// Get location requests (sent or received) - MUST be before /:id
router.get('/requests', getLocationRequests);

// Deny location request (external employees only) - MUST be before /:id
router.patch(
  '/requests/:id/deny',
  authorize('external'),
  denyLocationRequest
);

// Delete location request (admin, super_admin, or requester)
router.delete(
  '/requests/:id',
  authorize('super_admin', 'admin', 'internal', 'external'),
  deleteLocationRequest
);

// Get location record by ID (role-based access)
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  getLocationById
);

// Delete location record (admin, super_admin)
router.delete(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(idParamSchema, 'params'),
  deleteLocation
);

export default router;
