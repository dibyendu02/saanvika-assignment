// NOTE:
// Currently, both internal and external employees must be within
// office radius to mark attendance.
// This can be relaxed for external employees if business rules change.


/**
 * Attendance Service
 * Handles attendance-related business logic with role-based access control
 */
import Attendance from '../models/attendance.model.js';
import Office from '../models/office.model.js';
import AppError from '../utils/AppError.js';

// Allowed radius in meters for marking attendance
const ALLOWED_RADIUS_METERS = 200;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon2 - Longitude of point 2
 * @param {number} lat2 - Latitude of point 2
 * @returns {number} - Distance in meters
 */
const calculateDistance = (lon1, lat1, lon2, lat2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get start of day in UTC for consistent date handling
 * @param {Date} date - Date object
 * @returns {Date} - Start of day in UTC
 */
const getStartOfDayUTC = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Mark attendance for the requesting user
 * @param {Object} requestingUser - The user marking attendance
 * @param {number} longitude - User's current longitude
 * @param {number} latitude - User's current latitude
 * @returns {Promise<Object>} - Created attendance record
 */
export const markAttendance = async (requestingUser, longitude, latitude) => {
  // Business rule: Only internal and external employees can mark attendance
  if (!['internal', 'external'].includes(requestingUser.role)) {
    throw new AppError('Only employees can mark attendance', 403);
  }

  // Business rule: User must have a primary office
  if (!requestingUser.primaryOfficeId) {
    throw new AppError('You must be assigned to an office to mark attendance', 400);
  }

  // Get user's primary office
  const office = await Office.findById(requestingUser.primaryOfficeId);
  if (!office) {
    throw new AppError('Your assigned office was not found', 404);
  }

  // Business rule: Office must have location set
  if (!office.location || !office.location.coordinates) {
    throw new AppError('Office location is not configured', 400);
  }

  // Business rule: Check proximity to office
  const [officeLon, officeLat] = office.location.coordinates;
  const distance = calculateDistance(longitude, latitude, officeLon, officeLat);

  if (distance > ALLOWED_RADIUS_METERS) {
    throw new AppError(
      `You must be within ${ALLOWED_RADIUS_METERS} meters of your office to mark attendance. Current distance: ${Math.round(distance)} meters`,
      400
    );
  }

  // Get today's date (start of day UTC)
  const today = getStartOfDayUTC();

  // Create attendance record
  // Unique index will reject duplicate entries for same user on same day
  try {
    const attendance = await Attendance.create({
      userId: requestingUser._id,
      date: today,
      markedAt: new Date(),
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      officeId: requestingUser.primaryOfficeId,
    });

    return attendance;
  } catch (error) {
    // Handle duplicate key error (attendance already marked today)
    if (error.code === 11000) {
      throw new AppError('Attendance already marked for today', 400);
    }
    throw error;
  }
};

/**
 * Get attendance records with role-based access control
 * @param {Object} requestingUser - The user making the request
 * @param {Object} filters - Query filters
 * @returns {Promise<{records: Array, total: number, page: number, pages: number}>}
 */
export const getAttendance = async (requestingUser, filters = {}) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    officeId,
    userId,
  } = filters;
  const skip = (page - 1) * limit;

  let query = {};

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Admin and super_admin can see all attendance, with optional filters
    if (officeId) {
      query.officeId = officeId;
    }
    if (userId) {
      query.userId = userId;
    }
  } else if (requestingUser.role === 'internal') {
    // Internal can only see attendance of their own office
    query.officeId = requestingUser.primaryOfficeId;
    // Internal cannot filter by userId (can see all from their office)
  } else if (requestingUser.role === 'external') {
    // External can only see their own attendance
    query.userId = requestingUser._id;
  } else {
    throw new AppError('You are not authorized to view attendance records', 403);
  }

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = getStartOfDayUTC(new Date(startDate));
    }
    if (endDate) {
      query.date.$lte = getStartOfDayUTC(new Date(endDate));
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('officeId', 'name address')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, markedAt: -1 }),
    Attendance.countDocuments(query),
  ]);

  return {
    records,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get attendance record by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} attendanceId - Attendance record ID
 * @returns {Promise<Object>} - Attendance record
 */
export const getAttendanceById = async (requestingUser, attendanceId) => {
  const attendance = await Attendance.findById(attendanceId)
    .populate('userId', 'name email role primaryOfficeId')
    .populate('officeId', 'name address');

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Admin and super_admin can see any attendance record
    return attendance;
  }

  if (requestingUser.role === 'internal') {
    // Internal can only see attendance from their office
    if (attendance.officeId._id.toString() !== requestingUser.primaryOfficeId.toString()) {
      throw new AppError('You are not authorized to view this attendance record', 403);
    }
    return attendance;
  }

  if (requestingUser.role === 'external') {
    // External can only see their own attendance
    if (attendance.userId._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('You are not authorized to view this attendance record', 403);
    }
    return attendance;
  }

  throw new AppError('Access denied', 403);
};

export default {
  markAttendance,
  getAttendance,
  getAttendanceById,
};
