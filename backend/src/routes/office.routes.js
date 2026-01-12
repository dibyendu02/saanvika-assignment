/**
 * Office Routes
 * Office management endpoints with role-based access control
 */
import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
  addTarget,
  updateTarget,
  findNearbyOffices,
} from '../controllers/office.controller.js';
import {
  createOfficeSchema,
  updateOfficeSchema,
  addTargetSchema,
  updateTargetSchema,
  officeIdSchema,
  nearbyOfficesSchema,
  validate,
} from '../validators/office.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Nearby offices (must be before /:id to avoid conflict)
router.get(
  '/nearby',
  validate(nearbyOfficesSchema, 'query'),
  findNearbyOffices
);

// Public routes (all authenticated users with access control in service)
router.get('/', getAllOffices);
router.get(
  '/:id',
  validate(officeIdSchema, 'params'),
  getOfficeById
);

// Admin/Super Admin only routes
router.post(
  '/',
  authorize('admin', 'super_admin'),
  validate(createOfficeSchema),
  createOffice
);

router.put(
  '/:id',
  authorize('admin', 'super_admin'),
  validate(officeIdSchema, 'params'),
  validate(updateOfficeSchema),
  updateOffice
);

// Target management (admin/super_admin)
router.post(
  '/:id/targets',
  authorize('admin', 'super_admin'),
  validate(officeIdSchema, 'params'),
  validate(addTargetSchema),
  addTarget
);

router.put(
  '/:id/targets',
  authorize('admin', 'super_admin'),
  validate(officeIdSchema, 'params'),
  validate(updateTargetSchema),
  updateTarget
);

// Super Admin only - delete office
router.delete(
  '/:id',
  authorize('super_admin'),
  validate(officeIdSchema, 'params'),
  deleteOffice
);

export default router;
