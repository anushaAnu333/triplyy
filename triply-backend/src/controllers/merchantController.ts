import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Activity, User, ActivityBooking, ActivityAvailability } from '../models';
import { successResponse, createdResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import { uploadImages } from '../utils/cloudinary';
import { cleanupFiles } from '../utils/upload';
import logger from '../utils/logger';

/**
 * Register as merchant
 * POST /api/v1/merchant/register
 */
export const registerAsMerchant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    // Check if user is already a merchant
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'merchant') {
      throw new AppError('You are already registered as a merchant', 400);
    }

    if (user.role === 'admin') {
      throw new AppError('Admins cannot register as merchants', 400);
    }

    // Update user role
    user.role = 'merchant';
    await user.save();

    createdResponse(res, 'Successfully registered as merchant. You can now submit activities.', {
      role: 'merchant',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a new activity (Merchant)
 * POST /api/v1/merchant/activities
 */
export const submitActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is a merchant
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can submit activities', 403);
    }

    const { title, description, location, price, currency } = req.body;

    // Validate required fields
    if (!title || !description || !location || !price) {
      throw new AppError('Title, description, location, and price are required', 400);
    }

    // Check if files were uploaded
    const files = req.files as Express.Multer.File[];
    
    logger.info('Files received:', {
      files: files ? files.map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
      })) : 'No files',
    });

    if (!files || files.length === 0) {
      throw new AppError('At least one photo is required', 400);
    }

    if (files.length > 3) {
      throw new AppError('Maximum 3 photos allowed', 400);
    }

    // Validate file paths exist
    for (const file of files) {
      if (!file.path) {
        throw new AppError('File path is missing', 400);
      }
    }

    // Upload images to Cloudinary
    const filePaths = files.map((file) => file.path);
    let photoUrls: string[] = [];

    try {
      // Log file information for debugging
      logger.info('Uploading images:', {
        fileCount: files.length,
        filePaths: filePaths,
        fileSizes: files.map((f) => f.size),
        fileNames: files.map((f) => f.originalname),
      });

      const uploadResults = await uploadImages(filePaths);
      photoUrls = uploadResults.map((result) => result.url);
      
      logger.info('Images uploaded successfully:', {
        photoUrls: photoUrls,
      });
    } catch (error: any) {
      // Clean up uploaded files if Cloudinary upload fails
      cleanupFiles(filePaths);
      logger.error('Image upload failed:', {
        error: error?.message,
        errorName: error?.name,
        stack: error?.stack,
        filePaths: filePaths,
      });
      
      // Pass through the specific error message from Cloudinary
      const errorMessage = error?.message || 'Failed to upload images. Please check your Cloudinary configuration.';
      throw new AppError(errorMessage, 500);
    }

    // Clean up local files after successful upload
    cleanupFiles(filePaths);

    // Create activity
    const activity = await Activity.create({
      merchantId: req.user.userId,
      title,
      description,
      location,
      price: parseFloat(price),
      currency: currency || 'AED',
      photos: photoUrls,
      status: 'pending',
    });

    createdResponse(res, 'Activity submitted successfully. Waiting for admin approval.', activity);
  } catch (error) {
    // Clean up files if error occurred
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const filePaths = files.map((file) => file.path);
      cleanupFiles(filePaths);
    }
    next(error);
  }
};

/**
 * Get merchant's activities
 * GET /api/v1/merchant/activities
 */
export const getMerchantActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can view their activities', 403);
    }

    const activities = await Activity.find({ merchantId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    successResponse(res, 'Activities retrieved successfully', activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant dashboard stats
 * GET /api/v1/merchant/dashboard
 */
export const getMerchantDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can access dashboard', 403);
    }

    const userId = req.user.userId;

    // Get merchant's activities
    const activities = await Activity.find({ merchantId: userId });
    const activityIds = activities.map((a) => a._id);

    // Get all bookings for merchant's activities
    const bookings = await ActivityBooking.find({
      activityId: { $in: activityIds },
    })
      .populate('activityId', 'title')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Calculate earnings stats
    let totalEarnings = 0;
    let pendingPayouts = 0;
    let paidOut = 0;
    let totalBookings = 0;
    let completedBookings = 0;

    bookings.forEach((booking) => {
      if (booking.payment.paymentStatus === 'completed') {
        totalEarnings += booking.payment.merchantAmount;
        totalBookings += 1;

        if (booking.payment.merchantPayoutStatus === 'pending') {
          pendingPayouts += booking.payment.merchantAmount;
        } else if (booking.payment.merchantPayoutStatus === 'paid') {
          paidOut += booking.payment.merchantAmount;
        }

        if (booking.status === 'payment_completed' || booking.status === 'confirmed') {
          completedBookings += 1;
        }
      }
    });

    // Calculate activity stats
    const activityStats = await ActivityBooking.aggregate([
      {
        $match: {
          activityId: { $in: activityIds },
          'payment.paymentStatus': 'completed',
        },
      },
      {
        $group: {
          _id: '$activityId',
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: '$payment.merchantAmount' },
        },
      },
    ]);

    // Map activity stats to include activity details
    const activitiesWithStats = activities.map((activity) => {
      const stats = activityStats.find(
        (s) => s._id.toString() === activity._id.toString()
      );
      return {
        _id: activity._id,
        title: activity.title,
        status: activity.status,
        bookingsCount: stats?.bookingsCount || 0,
        revenue: stats?.totalRevenue || 0,
      };
    });

    // Get recent bookings (last 5)
    const recentBookings = bookings
      .slice(0, 5)
      .map((booking) => ({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        activityTitle: (booking.activityId as any)?.title || 'Unknown',
        customerName: booking.customerName,
        selectedDate: booking.selectedDate,
        numberOfParticipants: booking.numberOfParticipants,
        amount: booking.payment.amount,
        merchantAmount: booking.payment.merchantAmount,
        currency: booking.payment.currency,
        status: booking.status,
        paymentStatus: booking.payment.paymentStatus,
        payoutStatus: booking.payment.merchantPayoutStatus,
        createdAt: booking.createdAt,
      }));

    successResponse(res, 'Dashboard data retrieved successfully', {
      stats: {
        totalEarnings,
        pendingPayouts,
        paidOut,
        totalBookings,
        completedBookings,
        totalActivities: activities.length,
        approvedActivities: activities.filter((a) => a.status === 'approved').length,
      },
      activitiesWithStats,
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get merchant's bookings
 * GET /api/v1/merchant/bookings
 */
export const getMerchantBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can view bookings', 403);
    }

    const userId = req.user.userId;
    const { page = '1', limit = '10', status } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    // Get merchant's activities
    const activities = await Activity.find({ merchantId: userId });
    const activityIds = activities.map((a) => a._id);

    // Build query
    const query: any = {
      activityId: { $in: activityIds },
    };

    if (status) {
      query.status = status;
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      ActivityBooking.find(query)
        .populate('activityId', 'title photos')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityBooking.countDocuments(query),
    ]);

    const bookingsData = bookings.map((booking) => ({
      _id: booking._id,
      bookingReference: booking.bookingReference,
      activity: {
        _id: (booking.activityId as any)?._id,
        title: (booking.activityId as any)?.title,
        photos: (booking.activityId as any)?.photos || [],
      },
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
      },
      selectedDate: booking.selectedDate,
      numberOfParticipants: booking.numberOfParticipants,
      payment: {
        amount: booking.payment.amount,
        merchantAmount: booking.payment.merchantAmount,
        triplyCommission: booking.payment.triplyCommission,
        currency: booking.payment.currency,
        paymentStatus: booking.payment.paymentStatus,
        merchantPayoutStatus: booking.payment.merchantPayoutStatus,
        merchantPayoutDate: booking.payment.merchantPayoutDate,
      },
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    successResponse(res, 'Bookings retrieved successfully', {
      data: bookingsData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity availability for merchant's activity
 * GET /api/v1/merchant/activities/:activityId/availability
 */
export const getActivityAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can view activity availability', 403);
    }

    const { activityId } = req.params;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    // Verify activity belongs to merchant
    const activity = await Activity.findOne({ _id: activityId, merchantId: req.user.userId });
    if (!activity) {
      throw new AppError('Activity not found or access denied', 404);
    }

    // Build date range query
    const query: any = { activityId };
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const availability = await ActivityAvailability.find(query)
      .sort({ date: 1 });

    successResponse(res, 'Availability retrieved successfully', {
      activityId,
      availability,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block/unblock dates for merchant's activity
 * PUT /api/v1/merchant/activities/:activityId/availability/block
 */
export const blockActivityDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can manage activity availability', 403);
    }

    const { activityId } = req.params;
    const { dates, isBlocked } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new AppError('Dates array is required', 400);
    }

    // Verify activity belongs to merchant
    const activity = await Activity.findOne({ _id: activityId, merchantId: req.user.userId });
    if (!activity) {
      throw new AppError('Activity not found or access denied', 404);
    }

    // Update or create availability records for each date
    const activityObjectId = new mongoose.Types.ObjectId(activityId);
    const bulkOps = dates.map((dateStr: string) => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      return {
        updateOne: {
          filter: { activityId: activityObjectId, date },
          update: {
            $set: {
              activityId: activityObjectId,
              date,
              isAvailable: !isBlocked,
            },
            $setOnInsert: {
              availableSlots: 999,
              bookedSlots: 0,
            },
          },
          upsert: true,
        },
      };
    });

    await ActivityAvailability.bulkWrite(bulkOps);

    successResponse(res, `${isBlocked ? 'Blocked' : 'Unblocked'} ${dates.length} date(s) successfully`, {
      activityId,
      datesUpdated: dates.length,
      isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update slots for merchant's activity dates
 * PUT /api/v1/merchant/activities/:activityId/availability/slots
 */
export const updateActivitySlots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can manage activity availability', 403);
    }

    const { activityId } = req.params;
    const { dates, totalSlots } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new AppError('Dates array is required', 400);
    }

    if (!totalSlots || totalSlots < 0) {
      throw new AppError('Total slots must be a positive number', 400);
    }

    // Verify activity belongs to merchant
    const activity = await Activity.findOne({ _id: activityId, merchantId: req.user.userId });
    if (!activity) {
      throw new AppError('Activity not found or access denied', 404);
    }

    // Update or create availability records for each date
    const activityObjectId = new mongoose.Types.ObjectId(activityId);
    const bulkOps = dates.map((dateStr: string) => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      return {
        updateOne: {
          filter: { activityId: activityObjectId, date },
          update: {
            $set: {
              activityId: activityObjectId,
              date,
              availableSlots: totalSlots,
            },
            $setOnInsert: {
              bookedSlots: 0,
              isAvailable: true,
            },
          },
          upsert: true,
        },
      };
    });

    await ActivityAvailability.bulkWrite(bulkOps);

    successResponse(res, `Updated slots for ${dates.length} date(s) successfully`, {
      activityId,
      datesUpdated: dates.length,
      totalSlots,
    });
  } catch (error) {
    next(error);
  }
};
