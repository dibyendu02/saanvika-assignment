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
} from '../controllers/attendance.controller.js';
import {
  markAttendanceSchema,
  getAttendanceQuerySchema,
  attendanceIdSchema,
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

export default router;
