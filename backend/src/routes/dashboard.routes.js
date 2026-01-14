/**
 * Dashboard Routes
 * Dashboard summary endpoints
 */
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get dashboard summary (all authenticated users)
router.get('/summary', getDashboardSummary);

export default router;
