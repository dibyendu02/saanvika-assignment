/**
 * Goodies Routes
 * Goodies distribution and receiving endpoints
 */
import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  createDistribution,
  getDistributions,
  getDistributionById,
  receiveGoodies,
  getReceivedGoodies,
  getReceivedById,
  getEligibleEmployees,
  getEligibleEmployees,
  bulkUploadDistributions,
  deleteDistribution,
  deleteReceivedRecord,
} from '../controllers/goodies.controller.js';
import { uploadSingleFile, handleUploadError } from '../middlewares/upload.middleware.js';
import {
  createDistributionSchema,
  receiveGoodiesSchema,
  getDistributionsQuerySchema,
  getReceivedQuerySchema,
  idParamSchema,
  validate,
} from '../validators/goodies.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Distribution routes
router.post(
  '/distributions',
  authorize('admin', 'super_admin'),
  validate(createDistributionSchema),
  createDistribution
);

router.post(
  '/bulk-upload',
  authorize('admin', 'super_admin'),
  uploadSingleFile,
  handleUploadError,
  bulkUploadDistributions
);

router.get(
  '/distributions',
  validate(getDistributionsQuerySchema, 'query'),
  getDistributions
);

router.get(
  '/distributions/:id',
  validate(idParamSchema, 'params'),
  getDistributionById
);

router.get(
  '/distributions/:id/eligible-employees',
  validate(idParamSchema, 'params'),
  getEligibleEmployees
);

router.delete(
  '/distributions/:id',
  authorize('admin', 'super_admin'),
  validate(idParamSchema, 'params'),
  deleteDistribution
);

// Receive goodies route
router.post(
  '/receive',
  authorize('internal', 'external'),
  validate(receiveGoodiesSchema),
  receiveGoodies
);

// Received goodies routes
router.get(
  '/received',
  validate(getReceivedQuerySchema, 'query'),
  getReceivedGoodies
);

router.get(
  '/received/:id',
  validate(idParamSchema, 'params'),
  getReceivedById
);

router.delete(
  '/received/:id',
  authorize('admin', 'super_admin'),
  validate(idParamSchema, 'params'),
  deleteReceivedRecord
);

export default router;
