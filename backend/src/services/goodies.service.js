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
  const { officeId, goodiesType, distributionDate, totalQuantity, isForAllEmployees, targetEmployees, unregisteredRecipients } = distributionData;

  // Validate office exists ONLY if officeId is provided
  if (officeId) {
    const office = await Office.findById(officeId);
    if (!office) {
      throw new AppError('Office not found', 404);
    }
  }

  // If targeted distribution, validate target employees (only if officeId is present)
  if (isForAllEmployees === false && officeId) {
    // Validate target employees if provided AND we are locking to an office
    if (targetEmployees && targetEmployees.length > 0) {
      const employees = await User.find({
        _id: { $in: targetEmployees },
        primaryOfficeId: officeId,
        status: 'active',
      });
      // Loose check for length to avoid blocking legitimate cross-office bulk adds
    }
  }

  try {
    const distribution = await GoodiesDistribution.create({
      officeId: officeId || null,
      goodiesType,
      distributionDate: new Date(distributionDate),
      totalQuantity,
      distributedBy: requestingUser._id,
      isForAllEmployees: isForAllEmployees !== undefined ? isForAllEmployees : true,
      targetEmployees: isForAllEmployees === false ? (targetEmployees || []) : [],
      unregisteredRecipients: isForAllEmployees === false ? (unregisteredRecipients || []) : [],
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
    // Admin can see distributions from their own office OR global distributions
    query.$or = [
      { officeId: requestingUser.primaryOfficeId },
      { officeId: null }
    ];
  } else if (['internal', 'external'].includes(requestingUser.role)) {
    // Internal and external can only see distributions from their office OR global
    // AND either for all employees OR they are in the targetEmployees list
    query.$and = [
      { $or: [{ officeId: requestingUser.primaryOfficeId }, { officeId: null }] },
      { $or: [{ isForAllEmployees: true }, { targetEmployees: requestingUser._id }] }
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

  // Check if requestingUser has received (only relevant for registered users)
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

    // Count unregistered claims directly from the document
    const unregisteredClaimedCount = d.unregisteredRecipients
      ? d.unregisteredRecipients.filter(r => r.isClaimed).length
      : 0;

    // Total claimed = Registered (from map) + Unregistered (from doc)
    const registeredClaimedCount = claimCountMap.get(d._id.toString()) || 0;
    dObj.claimedCount = registeredClaimedCount + unregisteredClaimedCount;

    dObj.isReceived = receivedSet.has(d._id.toString());
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

  // Allow if global distribution (officeId is null)
  if (!distribution.officeId) {
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

  // Check if user's office matches distribution office (ONLY check if officeId is present)
  if (distribution.officeId && distribution.officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
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

  let allRecords = records;
  let allTotal = total;

  // If specific distribution is requested, include unregistered claims
  if (distributionId) {
    const distribution = await GoodiesDistribution.findById(distributionId)
      .populate('officeId', 'name')
      .select('unregisteredRecipients goodiesType distributionDate officeId');

    if (distribution && distribution.unregisteredRecipients) {
      const unregisteredClaims = distribution.unregisteredRecipients
        .filter(r => r.isClaimed)
        .map(r => ({
          _id: r._id, // Use recipient ID as record ID
          goodiesDistributionId: {
            _id: distribution._id,
            goodiesType: distribution.goodiesType,
            distributionDate: distribution.distributionDate,
            officeId: distribution.officeId
          },
          userId: {
            _id: r._id,
            name: r.name,
            email: null, // No email for unregistered
            role: 'unregistered'
          },
          receivedAt: r.claimedAt,
          receivedAtOfficeId: distribution.officeId,
          handedOverBy: r.handedOverBy,
          isUnregistered: true
        }));

      if (unregisteredClaims.length > 0) {
        // Merge and sort
        allRecords = [...records, ...unregisteredClaims].sort((a, b) =>
          new Date(b.receivedAt) - new Date(a.receivedAt)
        );
        // Adjust total only if we are taking all (ignoring pagination for merged list for now as typically limit is high enough for modal)
        allTotal += unregisteredClaims.length;
      }
    }
  }

  const pagination = buildPaginationMeta(allTotal, page, limit);

  return {
    records: allRecords,
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
    .populate('targetEmployees', 'name email role employeeId');

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
    }).select('name email role employeeId');

    return allEmployees;
  }

  // If targeted, return the target employees
  // Also include unregisteredRecipients if any (converting them to similar format)
  let result = [...distribution.targetEmployees];
  if (distribution.unregisteredRecipients && distribution.unregisteredRecipients.length > 0) {
    const unregistered = distribution.unregisteredRecipients.map(u => ({
      _id: u._id,
      name: u.name,
      email: 'N/A',
      role: 'unregistered',
      employeeId: u.employeeId || 'N/A',
      isClaimed: u.isClaimed
    }));
    result = [...result, ...unregistered];
  }

  return result;
};

/**
 * Bulk create goodies distribution from parsed Excel items
 * @param {Object} requestingUser - The user creating the distributions
 * @param {Object} bulkData - Object containing distributions items and global settings
 * @returns {Promise<Object>} - Results of creation
 */
export const bulkCreateDistribution = async (requestingUser, bulkData) => {
  const { registeredUsers, unregisteredRecipients, goodiesType, distributionDate, totalQuantityPerEmployee } = bulkData;

  const results = {
    totalProcessed: (registeredUsers?.length || 0) + (unregisteredRecipients?.length || 0),
    success: [],
    failed: []
  };

  try {
    // Prepare lists
    const registeredIds = registeredUsers ? registeredUsers.map(u => u.userId) : [];
    const unregisteredList = unregisteredRecipients ? unregisteredRecipients.map(u => ({
      name: u.name,
      employeeId: u.employeeId,
      officeId: u.officeId // This might be null, which is now allowed
    })) : [];

    const totalRecipients = registeredIds.length + unregisteredList.length;

    // Create SINGLE distribution for all users globally (or cross-office)
    const distribution = await createDistribution(requestingUser, {
      officeId: null, // Global distribution
      goodiesType,
      distributionDate,
      totalQuantity: totalRecipients * (1), // Assuming 1 per person
      isForAllEmployees: false,
      targetEmployees: registeredIds,
      unregisteredRecipients: unregisteredList
    });

    results.success.push({
      office: 'All Offices',
      registeredCount: registeredIds.length,
      unregisteredCount: unregisteredList.length,
      distributionId: distribution._id
    });

  } catch (error) {
    results.failed.push({
      office: 'Global',
      error: error.message
    });
  }

  return results;
};

/**
 * Delete a goodies distribution
 * @param {Object} requestingUser - The user performing the action
 * @param {string} distributionId - ID of distribution to delete
 * @returns {Promise<void>}
 */
export const deleteDistribution = async (requestingUser, distributionId) => {
  const distribution = await GoodiesDistribution.findById(distributionId);

  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Access control
  if (requestingUser.role === 'super_admin') {
    // Super admin can delete any distribution
  } else if (requestingUser.role === 'admin') {
    // Admin can only delete distributions for their office
    if (distribution.officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to delete this distribution', 403);
    }
  } else {
    throw new AppError('You are not authorized to delete distributions', 403);
  }

  // Check if any goodies have been received
  const receivedCount = await GoodiesReceived.countDocuments({
    goodiesDistributionId: distributionId
  });

  if (receivedCount > 0) {
    throw new AppError(`Cannot delete distribution because ${receivedCount} employees have already received goodies`, 400);
  }

  await GoodiesDistribution.findByIdAndDelete(distributionId);
};

/**
 * Delete a received goodies record
 * @param {Object} requestingUser - The user performing the action
 * @param {string} recordId - ID of received record to delete
 * @returns {Promise<void>}
 */
export const deleteReceivedRecord = async (requestingUser, recordId) => {
  // 1. Try to find in GoodiesReceived (Registered users)
  const record = await GoodiesReceived.findById(recordId)
    .populate('userId', 'primaryOfficeId')
    .populate('receivedAtOfficeId', '_id');

  if (record) {
    // Access control for Registered Users
    if (requestingUser.role === 'super_admin') {
      // Super admin can delete any record
    } else if (requestingUser.role === 'admin') {
      // Admin can only delete records for their office employees OR records created at their office
      const isEmployeeInOffice = record.userId?.primaryOfficeId?.toString() === requestingUser.primaryOfficeId?.toString();
      const isAtOffice = record.receivedAtOfficeId?._id.toString() === requestingUser.primaryOfficeId?.toString();

      if (!isEmployeeInOffice && !isAtOffice) {
        throw new AppError('You are not authorized to delete this record', 403);
      }
    } else {
      throw new AppError('You are not authorized to delete received records', 403);
    }

    await GoodiesReceived.findByIdAndDelete(recordId);
    return;
  }

  // 2. If not found, try to find in Unregistered Recipients (Embedded in Distribution)
  const distributionWithRecipient = await GoodiesDistribution.findOne({
    "unregisteredRecipients._id": recordId
  });

  if (distributionWithRecipient) {
    const recipient = distributionWithRecipient.unregisteredRecipients.find(r => r._id.toString() === recordId);

    if (!recipient || !recipient.isClaimed) {
      throw new AppError('Received record not found or not claimed', 404);
    }

    // Access control for Unregistered Users
    if (requestingUser.role === 'super_admin') {
      // Allowed
    } else if (requestingUser.role === 'admin') {
      // If distribution is office-bound, check office
      if (distributionWithRecipient.officeId && distributionWithRecipient.officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
        throw new AppError('You are not authorized to delete this record', 403);
      }
      // If global (officeId: null), admins generally shouldn't touch it unless we define rules, 
      // but let's allow if they are managing the page. 
      // For safety in this "Global" context: if officeId is null, maybe check if they handed it over? 
      // or just allow for now if they are admin.
    } else {
      throw new AppError('You are not authorized to delete received records', 403);
    }

    // Revert claim
    await GoodiesDistribution.updateOne(
      { "unregisteredRecipients._id": recordId },
      {
        $set: {
          "unregisteredRecipients.$.isClaimed": false,
          "unregisteredRecipients.$.claimedAt": null,
          "unregisteredRecipients.$.handedOverBy": null
        }
      }
    );
    return;
  }

  throw new AppError('Received record not found', 404);
};

/**
 * Manually mark a claim for an employee (admin/super_admin only)
 * @param {Object} requestingUser - The admin/super_admin performing the action
 * @param {string} distributionId - Distribution ID
 * @param {string} targetUserId - The user ID to mark as claimed
 * @returns {Promise<Object>} - Created receipt record
 */
export const markClaimForEmployee = async (requestingUser, distributionId, targetUserId) => {
  // Validate distribution exists
  const distribution = await GoodiesDistribution.findById(distributionId);
  if (!distribution) {
    throw new AppError('Distribution not found', 404);
  }

  // Access control - only admin and super_admin can manually mark claims
  if (!['super_admin', 'admin'].includes(requestingUser.role)) {
    throw new AppError('You are not authorized to manually mark claims', 403);
  }

  // Admin can only mark claims for their office
  if (requestingUser.role === 'admin' && distribution.officeId) {
    if (distribution.officeId.toString() !== requestingUser.primaryOfficeId?.toString()) {
      throw new AppError('You are not authorized to mark claims for this distribution', 403);
    }
  }

  // Validate target user exists (either registered or unregistered)
  let targetUser = await User.findById(targetUserId);
  let isUnregistered = false;
  let unregisteredRecipient = null;

  if (!targetUser) {
    // Check if it's an unregistered recipient in this distribution
    unregisteredRecipient = distribution.unregisteredRecipients?.find(
      r => r._id.toString() === targetUserId
    );

    if (unregisteredRecipient) {
      isUnregistered = true;
      // Mock targetUser object for subsequent checks if needed, or handle separately
    } else {
      throw new AppError('Target user not found', 404);
    }
  }

  // Check if target user's office matches distribution office (only for registered and office-specific distributions)
  if (!isUnregistered && distribution.officeId && distribution.officeId.toString() !== targetUser.primaryOfficeId?.toString()) {
    throw new AppError('Target user does not belong to the distribution office', 400);
  }

  // Check if distribution is targeted and user is eligible
  if (!distribution.isForAllEmployees) {
    let isEligible = false;
    if (!isUnregistered) {
      isEligible = distribution.targetEmployees.some(
        empId => empId.toString() === targetUserId
      );
    } else {
      isEligible = true; // If they are in unregisteredRecipients, they are eligible by definition
    }

    if (!isEligible) {
      throw new AppError('Target user is not eligible for this distribution', 400);
    }
  }

  // Check if there are remaining goodies available
  const claimedCount = await GoodiesReceived.countDocuments({
    goodiesDistributionId: distributionId,
  });

  // Calculate claimed count including unregistered
  const unregisteredClaimedCount = distribution.unregisteredRecipients?.filter(r => r.isClaimed).length || 0;
  const totalClaimed = claimedCount + unregisteredClaimedCount;

  if (totalClaimed >= distribution.totalQuantity) {
    throw new AppError('No goodies remaining in this distribution', 400);
  }

  try {
    if (isUnregistered) {
      // Handle unregistered claim
      if (unregisteredRecipient.isClaimed) {
        throw new AppError('This employee has already claimed these goodies', 400);
      }

      // Update distribution document
      await GoodiesDistribution.updateOne(
        { _id: distributionId, "unregisteredRecipients._id": targetUserId },
        {
          $set: {
            "unregisteredRecipients.$.isClaimed": true,
            "unregisteredRecipients.$.claimedAt": new Date(),
            "unregisteredRecipients.$.handedOverBy": requestingUser._id
          }
        }
      );

      return {
        _id: targetUserId,
        userId: null,
        employeeName: unregisteredRecipient.name,
        status: 'claimed',
        receivedAt: new Date()
      };
    } else {
      // Handle registered claim
      // Use distribution office if set, otherwise use the target user's primary office
      const officeId = distribution.officeId || targetUser.primaryOfficeId;
      if (!officeId) {
        throw new AppError('Cannot determine office for this claim', 400);
      }

      const receipt = await GoodiesReceived.create({
        goodiesDistributionId: distributionId,
        userId: targetUserId,
        receivedAt: new Date(),
        receivedAtOfficeId: officeId,
        handedOverBy: requestingUser._id, // Admin who marked the claim
      });

      return receipt;
    }
  } catch (error) {
    // Handle duplicate key error (already received)
    if (error.code === 11000) {
      throw new AppError('This employee has already claimed these goodies', 400);
    }
    throw error;
  }
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
  deleteDistribution,
  deleteReceivedRecord,
  markClaimForEmployee,
};
