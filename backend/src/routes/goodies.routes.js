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
} from '../controllers/goodies.controller.js';
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

export default router;
