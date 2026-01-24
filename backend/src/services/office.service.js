/**
 * Office Service
 * Handles office-related business logic with role-based access control
 */
import Office from '../models/office.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import {
  parsePagination,
  buildPaginationMeta,
  buildSearchQuery,
  mergeSearchQuery,
} from '../utils/pagination.utils.js';

/**
 * Create a new office (admin/super_admin only)
 * @param {Object} officeData - Office data
 * @returns {Promise<Object>} - Created office
 */
export const createOffice = async (officeData) => {
  console.log('Creating office with data:', officeData);
  const office = await Office.create(officeData);
  console.log('Office created:', office.toObject());
  return office;
};

/**
 * Get all offices with access control
 * @param {Object} requestingUser - The user making the request
 * @param {Object} filters - Pagination and search filters
 * @returns {Promise<{offices: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getAllOffices = async (requestingUser, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { search } = filters;

  // Access control: external users have no access to offices
  if (requestingUser.role === 'external') {
    throw new AppError('You are not authorized to view offices', 403);
  }

  let query = {};

  // Access control: admin and internal can only see their own office
  if (requestingUser.role === 'admin' || requestingUser.role === 'internal') {
    query._id = requestingUser.primaryOfficeId;
  }

  // Add search query if provided (search in name and address)
  const searchQuery = buildSearchQuery(search, ['name', 'address']);
  query = mergeSearchQuery(query, searchQuery);

  const [officesDocs, total] = await Promise.all([
    Office.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(), // Use lean() to allow adding properties
    Office.countDocuments(query),
  ]);

  // Calculate external employee count for each office (for target tracking)
  const offices = await Promise.all(
    officesDocs.map(async (office) => {
      const employeesCount = await User.countDocuments({
        primaryOfficeId: office._id,
        role: 'external', // Count only external employees for target tracking
        status: 'active',
      });
      return { ...office, currentEmployeeCount: employeesCount };
    })
  );

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    offices,
    ...pagination,
  };
};

/**
 * Get simple list of all offices (public)
 * @returns {Promise<Array>} - List of office names and IDs
 */
export const getPublicOffices = async () => {
  return await Office.find({}, 'name address').sort({ name: 1 });
};

/**
 * Get office by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} officeId - Office ID
 * @returns {Promise<Object>} - Office object
 */
export const getOfficeById = async (requestingUser, officeId) => {
  // Access control: external users have no access to offices
  if (requestingUser.role === 'external') {
    throw new AppError('You are not authorized to view offices', 403);
  }

  const office = await Office.findById(officeId);

  if (!office) {
    throw new AppError('Office not found', 404);
  }

  // Access control: admin and internal can only see their own office
  if (requestingUser.role === 'admin' || requestingUser.role === 'internal') {
    if (officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this office', 403);
    }
  }

  return office;
};

/**
 * Update office (admin/super_admin only)
 * @param {string} officeId - Office ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated office
 */
export const updateOffice = async (officeId, updateData) => {
  const office = await Office.findById(officeId);

  if (!office) {
    throw new AppError('Office not found', 404);
  }

  // Update allowed fields
  const allowedFields = ['name', 'address', 'location', 'targetHeadcount'];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      office[field] = updateData[field];
    }
  }

  await office.save();
  return office;
};

/**
 * Delete office (super_admin only)
 * @param {string} officeId - Office ID
 * @returns {Promise<void>}
 */
export const deleteOffice = async (officeId) => {
  const office = await Office.findById(officeId);

  if (!office) {
    throw new AppError('Office not found', 404);
  }

  await office.deleteOne();
};

/**
 * Add target to office
 * @param {string} officeId - Office ID
 * @param {Object} targetData - Target data { type, count, period }
 * @returns {Promise<Object>} - Updated office
 */
export const addTarget = async (officeId, targetData) => {
  const office = await Office.findById(officeId);

  if (!office) {
    throw new AppError('Office not found', 404);
  }

  // Check if target for same type and period already exists
  const existingTarget = office.targets.find(
    (t) => t.type === targetData.type && t.period === targetData.period
  );

  if (existingTarget) {
    throw new AppError(
      `Target for ${targetData.type} in period ${targetData.period} already exists`,
      400
    );
  }

  office.targets.push(targetData);
  await office.save();
  return office;
};

/**
 * Update target in office
 * @param {string} officeId - Office ID
 * @param {string} targetType - Target type (daily/monthly/yearly)
 * @param {string} period - Period string
 * @param {number} count - New count
 * @returns {Promise<Object>} - Updated office
 */
export const updateTarget = async (officeId, targetType, period, count) => {
  const office = await Office.findById(officeId);

  if (!office) {
    throw new AppError('Office not found', 404);
  }

  const target = office.targets.find(
    (t) => t.type === targetType && t.period === period
  );

  if (!target) {
    throw new AppError('Target not found', 404);
  }

  target.count = count;
  await office.save();
  return office;
};

/**
 * Find nearby offices using geospatial query
 * @param {number} longitude - Longitude coordinate
 * @param {number} latitude - Latitude coordinate
 * @param {number} maxDistance - Maximum distance in meters (default: 5000)
 * @returns {Promise<Array>} - Array of nearby offices
 */
export const findNearbyOffices = async (longitude, latitude, maxDistance = 5000) => {
  const offices = await Office.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  });

  return offices;
};

export default {
  createOffice,
  getAllOffices,
  getOfficeById,
  updateOffice,
  deleteOffice,
  addTarget,
  updateTarget,
  findNearbyOffices,
};
