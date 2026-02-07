import { Response, NextFunction } from 'express';
import { Booking, User, Destination, Commission, Activity } from '../models';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types/custom';
import AppError from '../utils/AppError';

/**
 * Get dashboard statistics
 * GET /api/v1/admin/stats
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalBookings,
      bookingsByStatus,
      totalUsers,
      totalAffiliates,
      commissionStats,
      revenueStats,
    ] = await Promise.all([
      // Total bookings
      Booking.countDocuments(),

      // Bookings by status
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Total users
      User.countDocuments({ role: 'user' }),

      // Total affiliates
      User.countDocuments({ role: 'affiliate' }),

      // Commission statistics
      Commission.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$commissionAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenue (completed payments)
      Booking.aggregate([
        { $match: { 'depositPayment.paymentStatus': 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$depositPayment.amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format booking status counts
    const statusCounts: Record<string, number> = {};
    bookingsByStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Calculate commission totals
    let totalCommissionsPending = 0;
    let totalCommissionsPaid = 0;
    commissionStats.forEach((stat) => {
      if (stat._id === 'pending' || stat._id === 'approved') {
        totalCommissionsPending += stat.total;
      } else if (stat._id === 'paid') {
        totalCommissionsPaid += stat.total;
      }
    });

    successResponse(res, 'Dashboard statistics retrieved', {
      overview: {
        totalBookings,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalUsers,
        totalAffiliates,
      },
      bookings: {
        total: totalBookings,
        pending: statusCounts['pending_deposit'] || 0,
        depositPaid: statusCounts['deposit_paid'] || 0,
        datesSelected: statusCounts['dates_selected'] || 0,
        confirmed: statusCounts['confirmed'] || 0,
        rejected: statusCounts['rejected'] || 0,
        cancelled: statusCounts['cancelled'] || 0,
      },
      commissions: {
        pending: totalCommissionsPending,
        paid: totalCommissionsPaid,
        total: totalCommissionsPending + totalCommissionsPaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent bookings
 * GET /api/v1/admin/recent-bookings
 */
export const getRecentBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

    const bookings = await Booking.find()
      .populate('userId', 'firstName lastName email')
      .populate('destinationId', 'name thumbnailImage')
      .select('bookingReference status depositPayment createdAt travelDates')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    successResponse(res, 'Recent bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue analytics
 * GET /api/v1/admin/revenue
 */
export const getRevenueAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat: string;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = '%Y-%m-%d';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateFormat = '%Y-%m';
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        dateFormat = '%Y-%m-%d';
        break;
    }

    const revenueByDate = await Booking.aggregate([
      {
        $match: {
          'depositPayment.paymentStatus': 'completed',
          'depositPayment.paidAt': { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$depositPayment.paidAt' } },
          revenue: { $sum: '$depositPayment.amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate totals
    const totalRevenue = revenueByDate.reduce((sum, item) => sum + item.revenue, 0);
    const totalBookings = revenueByDate.reduce((sum, item) => sum + item.count, 0);

    successResponse(res, 'Revenue analytics retrieved', {
      period,
      data: revenueByDate,
      summary: {
        totalRevenue,
        totalBookings,
        averagePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular destinations
 * GET /api/v1/admin/popular-destinations
 */
export const getPopularDestinations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 20);

    const popularDestinations = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['deposit_paid', 'dates_selected', 'confirmed'] },
        },
      },
      {
        $group: {
          _id: '$destinationId',
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$depositPayment.amount' },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'destinations',
          localField: '_id',
          foreignField: '_id',
          as: 'destination',
        },
      },
      { $unwind: '$destination' },
      {
        $project: {
          _id: 0,
          destinationId: '$_id',
          name: '$destination.name',
          thumbnailImage: '$destination.thumbnailImage',
          country: '$destination.country',
          bookingCount: 1,
          revenue: 1,
        },
      },
    ]);

    successResponse(res, 'Popular destinations retrieved', popularDestinations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user growth statistics
 * GET /api/v1/admin/user-growth
 */
export const getUserGrowth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat: string;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = '%Y-%m-%d';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateFormat = '%Y-%m';
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        dateFormat = '%Y-%m-%d';
        break;
    }

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    successResponse(res, 'User growth data retrieved', {
      period,
      data: userGrowth,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Activity Management ====================
/**
 * Get pending activities for approval
 * GET /api/v1/admin/activities/pending
 */
export const getPendingActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activities = await Activity.find({ status: 'pending' })
      .populate('merchantId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .select('-__v');

    successResponse(res, 'Pending activities retrieved successfully', activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an activity
 * PUT /api/v1/admin/activities/:id/approve
 */
export const approveActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id);

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    if (activity.status !== 'pending') {
      throw new AppError('Activity is not pending approval', 400);
    }

    activity.status = 'approved';
    activity.rejectionReason = undefined;
    await activity.save();

    successResponse(res, 'Activity approved successfully', activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an activity
 * PUT /api/v1/admin/activities/:id/reject
 */
export const rejectActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const activity = await Activity.findById(id);

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    if (activity.status !== 'pending') {
      throw new AppError('Activity is not pending approval', 400);
    }

    activity.status = 'rejected';
    activity.rejectionReason = rejectionReason;
    await activity.save();

    successResponse(res, 'Activity rejected successfully', activity);
  } catch (error) {
    next(error);
  }
};
