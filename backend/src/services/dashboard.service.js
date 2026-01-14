/**
 * Dashboard Service
 * Provides dashboard summary data with role-based access control
 */
import User from '../models/user.model.js';
import Office from '../models/office.model.js';
import Attendance from '../models/attendance.model.js';
import GoodiesReceived from '../models/goodiesReceived.model.js';
import AppError from '../utils/AppError.js';

/**
 * Get start of today in UTC
 * @returns {Date} - Start of today UTC
 */
const getStartOfTodayUTC = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

/**
 * Get dashboard summary with role-based access control
 * @param {Object} requestingUser - The user making the request
 * @returns {Promise<Object>} - Dashboard summary data
 */
export const getDashboardSummary = async (requestingUser) => {
  const today = getStartOfTodayUTC();

  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    // Full summary for admin and super_admin
    const [
      totalUsers,
      totalOffices,
      todayAttendanceCount,
      totalGoodiesDistributed,
      pendingEmployeeVerifications,
      offices,
    ] = await Promise.all([
      User.countDocuments({}),
      Office.countDocuments({}),
      Attendance.countDocuments({ date: today }),
      GoodiesReceived.countDocuments({}),
      User.countDocuments({ status: 'pending', role: 'external' }),
      Office.find({}).select('name targetHeadcount').lean(),
    ]);

    // Calculate current external employee count per office and target status
    const officeTargets = await Promise.all(
      offices.map(async (office) => {
        const externalCount = await User.countDocuments({
          primaryOfficeId: office._id,
          role: 'external',
          status: { $ne: 'deleted' },
        });

        return {
          officeId: office._id,
          officeName: office.name,
          targetHeadcount: office.targetHeadcount || 0,
          currentHeadcount: externalCount,
          targetReached: office.targetHeadcount > 0 ? externalCount >= office.targetHeadcount : null,
          progress: office.targetHeadcount > 0 ? Math.round((externalCount / office.targetHeadcount) * 100) : 0,
        };
      })
    );

    return {
      totalUsers,
      totalOffices,
      todayAttendanceCount,
      totalGoodiesDistributed,
      pendingEmployeeVerifications,
      officeTargets,
    };
  }

  if (requestingUser.role === 'internal') {
    // Office-specific summary for internal employees
    const officeId = requestingUser.primaryOfficeId;

    if (!officeId) {
      throw new AppError('You must be assigned to an office', 400);
    }

    const [
      totalUsers,
      todayAttendanceCount,
      totalGoodiesDistributed,
      pendingEmployeeVerifications,
    ] = await Promise.all([
      User.countDocuments({ primaryOfficeId: officeId }),
      Attendance.countDocuments({ officeId, date: today }),
      GoodiesReceived.countDocuments({ receivedAtOfficeId: officeId }),
      User.countDocuments({ primaryOfficeId: officeId, status: 'pending', role: 'external' }),
    ]);

    return {
      totalUsers,
      totalOffices: 1,
      todayAttendanceCount,
      totalGoodiesDistributed,
      pendingEmployeeVerifications,
    };
  }

  if (requestingUser.role === 'external') {
    // Own summary for external employees
    const userId = requestingUser._id;

    const [
      todayAttendanceCount,
      totalGoodiesDistributed,
    ] = await Promise.all([
      Attendance.countDocuments({ userId, date: today }),
      GoodiesReceived.countDocuments({ userId }),
    ]);

    return {
      totalUsers: 1,
      totalOffices: 1,
      todayAttendanceCount,
      totalGoodiesDistributed,
      pendingEmployeeVerifications: 0,
    };
  }

  throw new AppError('Access denied', 403);
};

export default {
  getDashboardSummary,
};
