/**
 * Goodies Service
 * Handles goodies distribution and receiving business logic
 */
import GoodiesDistribution from '../models/goodiesDistribution.model.js';
import GoodiesReceived from '../models/goodiesReceived.model.js';
import Office from '../models/office.model.js';
import AppError from '../utils/AppError.js';

/**
 * Create a new goodies distribution
 * @param {Object} requestingUser - The user creating the distribution
 * @param {Object} distributionData - Distribution data
 * @returns {Promise<Object>} - Created distribution
 */
export const createDistribution = async (requestingUser, distributionData) => {
  const { officeId, goodiesType, distributionDate, totalQuantity } = distributionData;

  // Validate office exists
  const office = await Office.findById(officeId);
  if (!office) {
    throw new AppError('Office not found', 404);
  }

  try {
    const distribution = await GoodiesDistribution.create({
      officeId,
      goodiesType,
      distributionDate: new Date(distributionDate),
      totalQuantity,
      distributedBy: requestingUser._id,
    });

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
 * @returns {Promise<{distributions: Array, total: number, page: number, pages: number}>}
 */
export const getDistributions = async (requestingUser, filters = {}) => {
  const { page = 1, limit = 10, officeId, startDate, endDate } = filters;
  const skip = (page - 1) * limit;

  let query = {};

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Admin and super_admin can see all distributions
    if (officeId) {
      query.officeId = officeId;
    }
  } else if (['internal', 'external'].includes(requestingUser.role)) {
    // Internal and external can only see distributions from their office
    query.officeId = requestingUser.primaryOfficeId;
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

  const [distributions, total] = await Promise.all([
    GoodiesDistribution.find(query)
      .populate('officeId', 'name address')
      .populate('distributedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ distributionDate: -1 }),
    GoodiesDistribution.countDocuments(query),
  ]);

  // Check if requesting user has already received these goodies
  const distributionIds = distributions.map((d) => d._id);
  const receivedRecords = await GoodiesReceived.find({
    userId: requestingUser._id,
    goodiesDistributionId: { $in: distributionIds },
  });

  const receivedSet = new Set(
    receivedRecords.map((r) => r.goodiesDistributionId.toString())
  );

  const distributionsWithStatus = distributions.map((d) => {
    const dObj = d.toObject();
    dObj.isReceived = receivedSet.has(d._id.toString());
    return dObj;
  });

  return {
    distributions: distributionsWithStatus,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
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
    .populate('distributedBy', 'name email');

  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
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
 * @returns {Promise<{records: Array, total: number, page: number, pages: number}>}
 */
export const getReceivedGoodies = async (requestingUser, filters = {}) => {
  const { page = 1, limit = 10, officeId, userId, distributionId, startDate, endDate } = filters;
  const skip = (page - 1) * limit;

  let query = {};

  // Filter by distribution ID if provided
  if (distributionId) {
    query.goodiesDistributionId = distributionId;
  }

  // Role-based access control
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Admin and super_admin can see all records
    if (officeId) {
      query.receivedAtOfficeId = officeId;
    }
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

  return {
    records,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
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
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
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

export default {
  createDistribution,
  getDistributions,
  getDistributionById,
  receiveGoodies,
  getReceivedGoodies,
  getReceivedById,
};
