/**
 * Dashboard Controller
 * Handles dashboard HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

/**
 * @desc    Get dashboard summary
 * @route   GET /api/v1/dashboard/summary
 * @access  Private (all authenticated roles)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user);

  res.status(200).json({
    success: true,
    data: { summary },
    message: 'Dashboard summary fetched successfully',
  });
});

export default {
  getDashboardSummary,
};
