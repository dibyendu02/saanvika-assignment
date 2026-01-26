/**
 * Attendance Routes
 * Attendance management endpoints with role-based access control
 */
import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  markAttendance,
  getAttendance,
  getAttendanceById,
  getMonthlySummary,
  deleteAttendance,
} from '../controllers/attendance.controller.js';
import {
  markAttendanceSchema,
  getAttendanceQuerySchema,
  attendanceIdSchema,
  monthlySummarySchema,
  validate,
} from '../validators/attendance.validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Mark attendance - only internal and external employees
router.post(
  '/mark',
  authorize('internal', 'external'),
  validate(markAttendanceSchema),
  markAttendance
);

// Get monthly attendance summary - all authenticated users (fine-grained in service)
router.get(
  '/summary/monthly',
  validate(monthlySummarySchema, 'query'),
  getMonthlySummary
);

// Get attendance records - all authenticated users (fine-grained in service)
router.get(
  '/',
  validate(getAttendanceQuerySchema, 'query'),
  getAttendance
);

// Get attendance record by ID - all authenticated users (fine-grained in service)
router.get(
  '/:id',
  validate(attendanceIdSchema, 'params'),
  getAttendanceById
);

// Delete attendance record - admin and super_admin
router.delete(
  '/:id',
  authorize('admin', 'super_admin'),
  validate(attendanceIdSchema, 'params'),
  deleteAttendance
);

export default router;

