/**
 * Attendance Controller
 * Handles attendance-related HTTP requests
 */
import asyncHandler from '../utils/asyncHandler.js';
import * as attendanceService from '../services/attendance.service.js';

/**
 * @desc    Mark attendance
 * @route   POST /api/v1/attendance/mark
 * @access  Private (internal, external)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { longitude, latitude } = req.body;

  const attendance = await attendanceService.markAttendance(
    req.user,
    longitude,
    latitude
  );

  res.status(201).json({
    success: true,
    data: { attendance },
    message: 'Attendance marked successfully',
  });
});

/**
 * @desc    Get attendance records
 * @route   GET /api/v1/attendance
 * @access  Private (role-based)
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate, officeId, userId } = req.query;

  const result = await attendanceService.getAttendance(req.user, {
    page: parseInt(page),
    limit: parseInt(limit),
    startDate,
    endDate,
    officeId,
    userId,
  });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Attendance records fetched successfully',
  });
});

/**
 * @desc    Get attendance record by ID
 * @route   GET /api/v1/attendance/:id
 * @access  Private (role-based)
 */
export const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAttendanceById(
    req.user,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: { attendance },
    message: 'Attendance record fetched successfully',
  });
});

export default {
  markAttendance,
  getAttendance,
  getAttendanceById,
};
