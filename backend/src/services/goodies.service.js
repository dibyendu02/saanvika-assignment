/**
 * Goodies Service
 * Handles goodies distribution and receiving business logic
 */
import GoodiesDistribution from '../models/goodiesDistribution.model.js';
import GoodiesReceived from '../models/goodiesReceived.model.js';
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
 * Create a new goodies distribution
 * @param {Object} requestingUser - The user creating the distribution
 * @param {Object} distributionData - Distribution data
 * @returns {Promise<Object>} - Created distribution
 */
export const createDistribution = async (requestingUser, distributionData) => {
  const { officeId, goodiesType, distributionDate, totalQuantity, isForAllEmployees, targetEmployees } = distributionData;

  // Validate office exists
  const office = await Office.findById(officeId);
  if (!office) {
    throw new AppError('Office not found', 404);
  }

  // If targeted distribution, validate target employees
  if (isForAllEmployees === false && targetEmployees && targetEmployees.length > 0) {
    // Validate all target employees exist and belong to the office
    const employees = await User.find({
      _id: { $in: targetEmployees },
      primaryOfficeId: officeId,
      status: 'active',
    });

    if (employees.length !== targetEmployees.length) {
      throw new AppError('Some target employees are invalid or do not belong to this office', 400);
    }
  }

  try {
    const distribution = await GoodiesDistribution.create({
      officeId,
      goodiesType,
      distributionDate: new Date(distributionDate),
      totalQuantity,
      distributedBy: requestingUser._id,
      isForAllEmployees: isForAllEmployees !== undefined ? isForAllEmployees : true,
      targetEmployees: isForAllEmployees === false ? targetEmployees : [],
    });

    // Populate targetEmployees for response
    await distribution.populate('targetEmployees', 'name email role');

    return distribution;
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      throw new AppError(
        'A distribution for this goodies type already exists at this office on this date',
        400
      );
    }
    throw error;
  }
};

/**
 * Get all distributions with role-based access control
 * @param {Object} requestingUser - The user making the request
 * @param {Object} filters - Query filters
 * @returns {Promise<{distributions: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getDistributions = async (requestingUser, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { officeId, startDate, endDate, search } = filters;

  let query = {};

  // Role-based access control
  if (requestingUser.role === 'super_admin') {
    // Super admin can see all distributions
    if (officeId) {
      query.officeId = officeId;
    }
  } else if (requestingUser.role === 'admin') {
    // Admin can only see distributions from their own office
    query.officeId = requestingUser.primaryOfficeId;
  } else if (['internal', 'external'].includes(requestingUser.role)) {
    // Internal and external can only see distributions from their office
    // AND either for all employees OR they are in the targetEmployees list
    query.officeId = requestingUser.primaryOfficeId;
    query.$or = [
      { isForAllEmployees: true },
      { targetEmployees: requestingUser._id }
    ];
  } else {
    throw new AppError('You are not authorized to view distributions', 403);
  }

  // Date range filter
  if (startDate || endDate) {
    query.distributionDate = {};
    if (startDate) {
      query.distributionDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.distributionDate.$lte = new Date(endDate);
    }
  }

  // Add search query if provided (search in goodiesType)
  const searchQuery = buildSearchQuery(search, ['goodiesType']);
  query = mergeSearchQuery(query, searchQuery);

  const [distributions, total] = await Promise.all([
    GoodiesDistribution.find(query)
      .populate('officeId', 'name address')
      .populate('distributedBy', 'name email')
      .populate('targetEmployees', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ distributionDate: -1 }),
    GoodiesDistribution.countDocuments(query),
  ]);

  // Check if requesting user has already received these goodies
  const distributionIds = distributions.map((d) => d._id);
  const [receivedRecords, claimCounts] = await Promise.all([
    GoodiesReceived.find({
      userId: requestingUser._id,
      goodiesDistributionId: { $in: distributionIds },
    }),
    GoodiesReceived.aggregate([
      { $match: { goodiesDistributionId: { $in: distributionIds } } },
      { $group: { _id: '$goodiesDistributionId', count: { $sum: 1 } } },
    ]),
  ]);

  const receivedSet = new Set(
    receivedRecords.map((r) => r.goodiesDistributionId.toString())
  );

  const claimCountMap = new Map(
    claimCounts.map((c) => [c._id.toString(), c.count])
  );

  const distributionsWithStatus = distributions.map((d) => {
    const dObj = d.toObject();
    dObj.isReceived = receivedSet.has(d._id.toString());
    dObj.claimedCount = claimCountMap.get(d._id.toString()) || 0;
    dObj.remainingCount = d.totalQuantity - dObj.claimedCount;
    return dObj;
  });

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    distributions: distributionsWithStatus,
    ...pagination,
  };
};

/**
 * Get distribution by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} distributionId - Distribution ID
 * @returns {Promise<Object>} - Distribution object
 */
export const getDistributionById = async (requestingUser, distributionId) => {
  const distribution = await GoodiesDistribution.findById(distributionId)
    .populate('officeId', 'name address')
    .populate('distributedBy', 'name email')
    .populate('targetEmployees', 'name email role');

  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Role-based access control
  if (requestingUser.role === 'super_admin') {
    return distribution;
  }

  if (requestingUser.role === 'admin') {
    // Admin can only see distributions from their office
    if (distribution.officeId._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this distribution', 403);
    }
    return distribution;
  }

  if (['internal', 'external'].includes(requestingUser.role)) {
    if (distribution.officeId._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this distribution', 403);
    }
    return distribution;
  }

  throw new AppError('Access denied', 403);
};

/**
 * Receive goodies
 * @param {Object} requestingUser - The user receiving goodies
 * @param {string} distributionId - Distribution ID
 * @returns {Promise<Object>} - Receipt record
 */
export const receiveGoodies = async (requestingUser, distributionId) => {
  // Validate distribution exists
  const distribution = await GoodiesDistribution.findById(distributionId);
  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Check if distribution is targeted and user is eligible
  if (!distribution.isForAllEmployees) {
    const isEligible = distribution.targetEmployees.some(
      empId => empId.toString() === requestingUser._id.toString()
    );

    if (!isEligible) {
      throw new AppError('You are not eligible to receive these goodies', 403);
    }
  }

  // Check if user's office matches distribution office
  if (distribution.officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
    throw new AppError('This distribution is not for your office', 403);
  }

  // Check if there are remaining goodies available
  const claimedCount = await GoodiesReceived.countDocuments({
    goodiesDistributionId: distributionId,
  });

  if (claimedCount >= distribution.totalQuantity) {
    throw new AppError('No goodies remaining in this distribution', 400);
  }

  try {
    const receipt = await GoodiesReceived.create({
      goodiesDistributionId: distributionId,
      userId: requestingUser._id,
      receivedAt: new Date(),
      receivedAtOfficeId: requestingUser.primaryOfficeId,
      handedOverBy: requestingUser._id, // Self-service receipt
    });

    return receipt;
  } catch (error) {
    // Handle duplicate key error (already received)
    if (error.code === 11000) {
      throw new AppError('You have already received these goodies', 400);
    }
    throw error;
  }
};

/**
 * Get received goodies with role-based access control
 * @param {Object} requestingUser - The user making the request
 * @param {Object} filters - Query filters
 * @returns {Promise<{records: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getReceivedGoodies = async (requestingUser, filters = {}) => {
  const { page, limit, skip } = parsePagination(filters);
  const { officeId, userId, distributionId, startDate, endDate } = filters;

  let query = {};

  // Filter by distribution ID if provided
  if (distributionId) {
    query.goodiesDistributionId = distributionId;
  }

  // Role-based access control
  if (requestingUser.role === 'super_admin') {
    // Super admin can see all records
    if (officeId) {
      query.receivedAtOfficeId = officeId;
    }
    if (userId) {
      query.userId = userId;
    }
  } else if (requestingUser.role === 'admin') {
    // Admin can only see records from their office
    query.receivedAtOfficeId = requestingUser.primaryOfficeId;
    if (userId) {
      query.userId = userId;
    }
  } else if (requestingUser.role === 'internal') {
    // Internal can see records from their office
    query.receivedAtOfficeId = requestingUser.primaryOfficeId;
  } else if (requestingUser.role === 'external') {
    // External can only see their own records
    query.userId = requestingUser._id;
  } else {
    throw new AppError('You are not authorized to view received goodies', 403);
  }

  // Date range filter
  if (startDate || endDate) {
    query.receivedAt = {};
    if (startDate) {
      query.receivedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.receivedAt.$lte = new Date(endDate);
    }
  }

  const [records, total] = await Promise.all([
    GoodiesReceived.find(query)
      .populate({
        path: 'goodiesDistributionId',
        select: 'goodiesType distributionDate officeId',
        populate: { path: 'officeId', select: 'name' },
      })
      .populate('userId', 'name email')
      .populate('receivedAtOfficeId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ receivedAt: -1 }),
    GoodiesReceived.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    records,
    ...pagination,
  };
};

/**
 * Get received record by ID with access control
 * @param {Object} requestingUser - The user making the request
 * @param {string} recordId - Record ID
 * @returns {Promise<Object>} - Receipt record
 */
export const getReceivedById = async (requestingUser, recordId) => {
  const record = await GoodiesReceived.findById(recordId)
    .populate({
      path: 'goodiesDistributionId',
      select: 'goodiesType distributionDate officeId',
      populate: { path: 'officeId', select: 'name' },
    })
    .populate('userId', 'name email')
    .populate('receivedAtOfficeId', 'name');

  if (!record) {
    throw new AppError('Receipt record not found', 404);
  }

  // Role-based access control
  if (requestingUser.role === 'super_admin') {
    return record;
  }

  if (requestingUser.role === 'admin') {
    // Admin can only see records from their office
    if (record.receivedAtOfficeId._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this record', 403);
    }
    return record;
  }

  if (requestingUser.role === 'internal') {
    if (record.receivedAtOfficeId._id.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to view this record', 403);
    }
    return record;
  }

  if (requestingUser.role === 'external') {
    if (record.userId._id.toString() !== requestingUser._id.toString()) {
      throw new AppError('You are not authorized to view this record', 403);
    }
    return record;
  }

  throw new AppError('Access denied', 403);
};

/**
 * Get eligible employees for a distribution
 * @param {Object} requestingUser - The user making the request
 * @param {string} distributionId - Distribution ID
 * @returns {Promise<Array>} - Array of eligible employees
 */
export const getEligibleEmployees = async (requestingUser, distributionId) => {
  const distribution = await GoodiesDistribution.findById(distributionId)
    .populate('officeId', 'name')
    .populate('targetEmployees', 'name email role');

  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Access control
  if (!['super_admin', 'admin', 'internal'].includes(requestingUser.role)) {
    throw new AppError('You are not authorized to view eligible employees', 403);
  }

  // If for all employees, get all active employees from the office
  if (distribution.isForAllEmployees) {
    const allEmployees = await User.find({
      primaryOfficeId: distribution.officeId._id,
      status: 'active',
      role: { $in: ['internal', 'external'] },
    }).select('name email role');

    return allEmployees;
  }

  // If targeted, return the target employees
  return distribution.targetEmployees;
};

/**
 * Bulk create goodies distribution from parsed Excel items
 * @param {Object} requestingUser - The user creating the distributions
 * @param {Object} bulkData - Object containing distributions items and global settings
 * @returns {Promise<Object>} - Results of creation
 */
export const bulkCreateDistribution = async (requestingUser, bulkData) => {
  const { items, goodiesType, distributionDate, totalQuantityPerEmployee } = bulkData;

  const results = {
    totalProcessed: items.length,
    success: [],
    failed: []
  };

  // Create a distribution for each office involved, or group items by office
  const itemsByOffice = items.reduce((acc, item) => {
    const officeId = item.office._id.toString();
    if (!acc[officeId]) {
      acc[officeId] = {
        office: item.office,
        employees: []
      };
    }
    acc[officeId].employees.push(item.user._id);
    return acc;
  }, {});

  for (const officeId in itemsByOffice) {
    const { office, employees } = itemsByOffice[officeId];

    try {
      const distribution = await createDistribution(requestingUser, {
        officeId,
        goodiesType,
        distributionDate,
        totalQuantity: employees.length * totalQuantityPerEmployee,
        isForAllEmployees: false,
        targetEmployees: employees
      });
      results.success.push({
        office: office.name,
        employeeCount: employees.length,
        distributionId: distribution._id
      });
    } catch (error) {
      results.failed.push({
        office: office.name,
        error: error.message
      });
    }
  }

  return results;
};

export default {
  createDistribution,
  getDistributions,
  getDistributionById,
  receiveGoodies,
  getReceivedGoodies,
  getReceivedById,
  getEligibleEmployees,
  bulkCreateDistribution,
};
