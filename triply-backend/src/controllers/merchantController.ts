import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Activity, User, ActivityBooking, ActivityAvailability, MerchantOnboarding } from '../models';
import { successResponse, createdResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import { uploadImages } from '../utils/cloudinary';
import { cleanupFiles } from '../utils/upload';
import logger from '../utils/logger';

const MERCHANT_TERMS_VERSION = '2026-03';

/**
 * Record merchant terms acceptance for current user
 * POST /api/v1/merchant/terms/accept
 */
export const acceptMerchantTerms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Admins cannot register as merchants', 400);

    const requestedVersion = typeof req.body?.version === 'string' ? req.body.version.trim() : '';
    user.merchantTermsAcceptedAt = new Date();
    user.merchantTermsVersion = requestedVersion || MERCHANT_TERMS_VERSION;
    await user.save();

    successResponse(res, 'Merchant terms accepted', {
      merchantTermsAcceptedAt: user.merchantTermsAcceptedAt,
      merchantTermsVersion: user.merchantTermsVersion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the logged-in user's latest merchant onboarding status
 * GET /api/v1/merchant/onboarding/status
 */
export const getMyOnboardingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const latest = await MerchantOnboarding.findOne({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    successResponse(res, 'Onboarding status retrieved', {
      status: latest?.status ?? null,
      applicationId: latest?._id?.toString() ?? null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit merchant onboarding application (multi-step form + documents)
 * POST /api/v1/merchant/onboarding
 */
export const submitOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  const filePaths: string[] = [];
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'merchant') throw new AppError('You are already a merchant', 400);
    if (user.role === 'admin') throw new AppError('Admins cannot register as merchants', 400);

    const rejectedLatest = await MerchantOnboarding.findOne({ userId, status: 'rejected' }).sort({
      updatedAt: -1,
    });

    const existingInReview = await MerchantOnboarding.findOne({
      userId,
      status: { $in: ['pending', 'reapplied'] },
    });
    if (existingInReview) {
      throw new AppError(
        'You already have a merchant application awaiting review. Please wait for the admin team before submitting again.',
        400
      );
    }

    if (!user.merchantTermsAcceptedAt && !rejectedLatest) {
      throw new AppError(
        'Please accept merchant terms and conditions before onboarding (POST /api/v1/merchant/terms/accept), or complete the terms step in the app.',
        400
      );
    }

    const businessType = req.body.businessType as string;
    const categoriesRaw = req.body.categories;
    const businessInfoRaw = req.body.businessInfo;
    const servicesRaw = req.body.services;

    if (!businessType || !categoriesRaw || !businessInfoRaw || !servicesRaw) {
      throw new AppError('businessType, categories, businessInfo and services are required', 400);
    }

    let categories: string[];
    let businessInfo: Record<string, unknown>;
    let services: Array<Record<string, unknown>>;
    try {
      categories = JSON.parse(categoriesRaw);
      businessInfo = JSON.parse(businessInfoRaw);
      services = JSON.parse(servicesRaw);
    } catch {
      throw new AppError('Invalid JSON in request body', 400);
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      throw new AppError('At least one category is required', 400);
    }
    if (!Array.isArray(services) || services.length === 0) {
      throw new AppError('At least one service is required', 400);
    }

    // Bank details: account number (replaces legacy `iban` field)
    const acctRaw =
      typeof businessInfo.accountNumber === 'string' ? businessInfo.accountNumber.trim() : '';
    const legacyIban = typeof businessInfo.iban === 'string' ? businessInfo.iban.trim() : '';
    const accountNumber = acctRaw || legacyIban;
    if (!accountNumber) {
      throw new AppError('Account number is required in business information', 400);
    }
    const digitsOnly = accountNumber.replace(/[\s-]/g, '');
    if (digitsOnly.length < 5 || digitsOnly.length > 34 || !/^\d+$/.test(digitsOnly)) {
      throw new AppError('Account number must be 5–34 digits (spaces or dashes allowed)', 400);
    }
    businessInfo.accountNumber = accountNumber;
    delete businessInfo.iban;

    const newUploadPaths: Record<string, string | string[]> = {};
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file.fieldname && file.path) {
          const existing = newUploadPaths[file.fieldname];
          if (!existing) {
            newUploadPaths[file.fieldname] = file.path;
          } else if (Array.isArray(existing)) {
            newUploadPaths[file.fieldname] = [...existing, file.path];
          } else {
            newUploadPaths[file.fieldname] = [existing, file.path];
          }
          filePaths.push(file.path);
        }
      });
    }

    const isResubmission = !!rejectedLatest;
    const mergedDocumentPaths: Record<string, string | string[]> = isResubmission
      ? {
          // Keep old document paths for any docs the user didn't re-upload
          ...((rejectedLatest?.documentPaths || {}) as Record<string, string | string[]>),
          ...newUploadPaths,
        }
      : newUploadPaths;
    const onboarding = await MerchantOnboarding.create({
      userId,
      businessType,
      categories,
      businessInfo,
      documentPaths: mergedDocumentPaths,
      services,
      status: isResubmission ? 'reapplied' : 'pending',
      previousApplicationId: isResubmission ? rejectedLatest!._id : undefined,
    });

    createdResponse(
      res,
      isResubmission
        ? 'Onboarding resubmitted successfully. Awaiting admin approval.'
        : 'Onboarding submitted successfully. Awaiting admin approval.',
      {
        applicationId: onboarding._id,
        role: user.role,
        resubmitted: isResubmission,
      }
    );
  } catch (error) {
    if (filePaths.length > 0) cleanupFiles(filePaths);
    next(error);
  }
};

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

    const {
      title,
      description,
      location,
      price,
      currency,
      duration,
      groupSize,
      languages,
      pointsHeading,
      pointGroups,
      includes,
      excludes,
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !price) {
      throw new AppError('Title, description, location, and price are required', 400);
    }

    const parseOptionalString = (val: unknown): string | undefined => {
      if (val === undefined || val === null) return undefined;
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim();
      return trimmed ? trimmed : undefined;
    };

    const parseOptionalNumber = (val: unknown): number | undefined => {
      if (val === undefined || val === null) return undefined;
      const raw = typeof val === 'string' ? val : String(val);
      const trimmed = raw.trim();
      if (!trimmed || trimmed === 'null') return undefined;
      const parsed = parseInt(trimmed, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    };

    const parseOptionalStringArray = (val: unknown): string[] | undefined => {
      if (val === undefined || val === null) return undefined;

      // If multer parsed the field as an array, normalize it.
      if (Array.isArray(val)) {
        const arr = val
          .map((x) => (typeof x === 'string' ? x.trim() : String(x).trim()))
          .filter(Boolean);
        return arr.length ? arr : undefined;
      }

      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim();
      if (!trimmed) return undefined;

      // Prefer JSON payload when available.
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const arr = parsed.map((x) => (typeof x === 'string' ? x.trim() : String(x).trim())).filter(Boolean);
          return arr.length ? arr : undefined;
        }
      } catch {
        // Fall back to treating it as a single value.
      }

      return [trimmed];
    };

    const parseOptionalPointGroups = (
      val: unknown
    ): Array<{ text: string; subPoints: string[] }> | undefined => {
      if (val === undefined || val === null) return undefined;

      const normalizeGroups = (groups: unknown): Array<{ text: string; subPoints: string[] }> | undefined => {
        if (!Array.isArray(groups)) return undefined;
        const normalized: Array<{ text: string; subPoints: string[] }> = [];
        for (const g of groups) {
          if (!g || typeof g !== 'object') continue;
          const record = g as { text?: unknown; subPoints?: unknown };
          const text = typeof record.text === 'string' ? record.text.trim() : '';
          const subs = Array.isArray(record.subPoints) ? record.subPoints : [];
          const subPoints = subs
            .map((sp) => (typeof sp === 'string' ? sp.trim() : String(sp).trim()))
            .filter(Boolean);
          if (!text && subPoints.length === 0) continue;
          normalized.push({ text, subPoints });
        }
        return normalized.length ? normalized : undefined;
      };

      if (Array.isArray(val)) return normalizeGroups(val);
      if (typeof val !== 'string') return undefined;

      const trimmed = val.trim();
      if (!trimmed) return undefined;
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeGroups(parsed);
      } catch {
        return undefined;
      }
    };

    const optionalDuration = parseOptionalString(duration);
    const optionalGroupSize = parseOptionalNumber(groupSize);
    const optionalLanguages = parseOptionalString(languages);
    const optionalPointsHeading = parseOptionalString(pointsHeading);
    const optionalPointGroups = parseOptionalPointGroups(pointGroups);
    const optionalIncludes = parseOptionalStringArray(includes);
    const optionalExcludes = parseOptionalStringArray(excludes);

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
      duration: optionalDuration,
      groupSize: optionalGroupSize,
      languages: optionalLanguages,
      pointsHeading: optionalPointsHeading,
      pointGroups: optionalPointGroups,
      includes: optionalIncludes,
      excludes: optionalExcludes,
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
 * Get single merchant activity by id
 * GET /api/v1/merchant/activities/:activityId
 */
export const getMerchantActivityById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can view their activities', 403);
    }

    const { activityId } = req.params as { activityId: string };
    const activity = await Activity.findOne({ _id: activityId, merchantId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    successResponse(res, 'Activity retrieved successfully', activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Merchant confirms the requested date/slot is available so the customer can pay
 * PUT /api/v1/merchant/activity-bookings/:bookingId/approve-availability
 */
export const approveActivityBookingMerchantAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can approve availability', 403);
    }

    const merchantId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await ActivityBooking.findById(bookingId).populate(
      'activityId',
      'merchantId status'
    );
    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    const activity = booking.activityId as { merchantId?: mongoose.Types.ObjectId; status?: string };
    if (!activity?.merchantId || String(activity.merchantId) !== String(merchantId)) {
      throw new AppError('Activity booking not found', 404);
    }

    if (activity.status !== 'approved') {
      throw new AppError(
        'The activity must be platform-approved before you can confirm availability for this booking',
        400
      );
    }

    if (booking.status !== 'pending_payment') {
      throw new AppError('Only pending activity bookings can be updated', 400);
    }

    if (booking.merchantAvailabilityApproved) {
      throw new AppError('Availability has already been approved for this booking', 400);
    }

    booking.merchantAvailabilityApproved = true;
    booking.merchantAvailabilityApprovedAt = new Date();
    await booking.save();

    successResponse(res, 'Availability approved. The customer can now complete payment.', {
      bookingReference: booking.bookingReference,
      merchantAvailabilityApproved: booking.merchantAvailabilityApproved,
    });
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
      .populate('activityId', 'title status')
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

    // Get recent bookings (last 8 by activity)
    const recentBookings = bookings
      .slice(0, 8)
      .map((booking) => ({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        activityTitle: (booking.activityId as any)?.title || 'Unknown',
        activityStatus: (booking.activityId as any)?.status,
        customerName: booking.customerName,
        selectedDate: booking.selectedDate,
        numberOfParticipants: booking.numberOfParticipants,
        amount: booking.payment.amount,
        merchantAmount: booking.payment.merchantAmount,
        currency: booking.payment.currency,
        status: booking.status,
        paymentStatus: booking.payment.paymentStatus,
        payoutStatus: booking.payment.merchantPayoutStatus,
        merchantAvailabilityApproved: Boolean(booking.merchantAvailabilityApproved),
        createdAt: booking.createdAt,
      }));

    // Latest paid bookings (customer completed payment) — surfaced prominently for merchants
    const recentPaidBookings = bookings
      .filter((b) => b.payment.paymentStatus === 'completed')
      .sort(
        (a, b) =>
          new Date(b.payment.paidAt || b.updatedAt).getTime() -
          new Date(a.payment.paidAt || a.updatedAt).getTime()
      )
      .slice(0, 6)
      .map((booking) => ({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        activityTitle: (booking.activityId as any)?.title || 'Unknown',
        activityStatus: (booking.activityId as any)?.status,
        customerName: booking.customerName,
        selectedDate: booking.selectedDate,
        numberOfParticipants: booking.numberOfParticipants,
        amount: booking.payment.amount,
        merchantAmount: booking.payment.merchantAmount,
        currency: booking.payment.currency,
        status: booking.status,
        paymentStatus: booking.payment.paymentStatus,
        payoutStatus: booking.payment.merchantPayoutStatus,
        paidAt: booking.payment.paidAt || booking.updatedAt,
        createdAt: booking.createdAt,
      }));

    const bookingStatusCounts = {
      pending_payment: 0,
      payment_completed: 0,
      confirmed: 0,
      cancelled: 0,
      refunded: 0,
    };
    bookings.forEach((b) => {
      const k = b.status as keyof typeof bookingStatusCounts;
      if (k in bookingStatusCounts) bookingStatusCounts[k] += 1;
    });

    const pendingListings = activities.filter((a) => a.status === 'pending').length;
    const rejectedListings = activities.filter((a) => a.status === 'rejected').length;

    const needsConfirmAvailabilityAll = bookings.filter(
      (b) =>
        b.status === 'pending_payment' &&
        (b.activityId as { status?: string })?.status === 'approved' &&
        !b.merchantAvailabilityApproved
    );
    const needsConfirmAvailabilityList = needsConfirmAvailabilityAll.slice(0, 8);

    const needsConfirmBookingAll = bookings.filter((b) => b.status === 'payment_completed');
    const needsConfirmBookingList = needsConfirmBookingAll.slice(0, 8);

    const awaitingGuestPaymentCount = bookings.filter(
      (b) =>
        b.status === 'pending_payment' &&
        (b.activityId as { status?: string })?.status === 'approved' &&
        b.merchantAvailabilityApproved &&
        b.payment.paymentStatus === 'pending'
    ).length;

    const mapBookingSummary = (booking: (typeof bookings)[0]) => ({
      _id: booking._id,
      bookingReference: booking.bookingReference,
      activityTitle: (booking.activityId as { title?: string })?.title || 'Unknown',
      customerName: booking.customerName,
      selectedDate: booking.selectedDate,
      numberOfParticipants: booking.numberOfParticipants,
      merchantAmount: booking.payment.merchantAmount,
      currency: booking.payment.currency,
      status: booking.status,
      paymentStatus: booking.payment.paymentStatus,
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const horizon = new Date(startOfToday);
    horizon.setDate(horizon.getDate() + 60);

    const upcomingBookings = bookings
      .filter((b) => {
        if (['cancelled', 'refunded'].includes(b.status)) return false;
        const runDate = b.lastActivityDate || b.selectedDate;
        if (!runDate) return false;
        const d = new Date(runDate);
        return d >= startOfToday && d <= horizon;
      })
      .sort((a, b) => new Date(a.selectedDate).getTime() - new Date(b.selectedDate).getTime())
      .slice(0, 8)
      .map((booking) => mapBookingSummary(booking));

    successResponse(res, 'Dashboard data retrieved successfully', {
      stats: {
        totalEarnings,
        pendingPayouts,
        paidOut,
        totalBookings,
        completedBookings,
        totalActivities: activities.length,
        approvedActivities: activities.filter((a) => a.status === 'approved').length,
        pendingListings,
        rejectedListings,
        awaitingGuestPayment: awaitingGuestPaymentCount,
        needsConfirmAvailability: needsConfirmAvailabilityAll.length,
        needsConfirmBooking: needsConfirmBookingAll.length,
      },
      bookingStatusCounts,
      needsConfirmAvailability: needsConfirmAvailabilityList.map(mapBookingSummary),
      needsConfirmBooking: needsConfirmBookingList.map(mapBookingSummary),
      upcomingBookings,
      activitiesWithStats,
      recentBookings,
      recentPaidBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single activity booking for the current merchant
 * GET /api/v1/merchant/bookings/:bookingId
 */
export const getMerchantBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'merchant') {
      throw new AppError('Only merchants can view bookings', 403);
    }

    const merchantId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await ActivityBooking.findById(bookingId)
      .populate('activityId', 'title photos status location description merchantId price currency')
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('availabilityId', 'date availableSlots bookedSlots')
      .populate('availabilityIds', 'date availableSlots bookedSlots');

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    const activity = booking.activityId as { merchantId?: mongoose.Types.ObjectId };
    if (!activity?.merchantId || String(activity.merchantId) !== String(merchantId)) {
      throw new AppError('Booking not found', 404);
    }

    const act = booking.activityId as {
      _id: mongoose.Types.ObjectId;
      title?: string;
      photos?: string[];
      status?: string;
      location?: string;
      description?: string;
      price?: number;
      currency?: string;
    };

    successResponse(res, 'Booking retrieved successfully', {
      _id: booking._id,
      bookingReference: booking.bookingReference,
      merchantAvailabilityApproved: Boolean(booking.merchantAvailabilityApproved),
      merchantAvailabilityApprovedAt: booking.merchantAvailabilityApprovedAt,
      activity: {
        _id: act._id,
        title: act.title,
        photos: act.photos || [],
        status: act.status,
        location: act.location,
        description: act.description,
        price: act.price,
        currency: act.currency,
      },
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
      },
      user: booking.userId
        ? {
            firstName: (booking.userId as { firstName?: string }).firstName,
            lastName: (booking.userId as { lastName?: string }).lastName,
            email: (booking.userId as { email?: string }).email,
            phoneNumber: (booking.userId as { phoneNumber?: string }).phoneNumber,
          }
        : undefined,
      selectedDate: booking.selectedDate,
      selectedDates: booking.selectedDates,
      lastActivityDate: booking.lastActivityDate,
      numberOfParticipants: booking.numberOfParticipants,
      specialRequests: booking.specialRequests,
      availability: booking.availabilityId
        ? {
            _id: (booking.availabilityId as { _id: mongoose.Types.ObjectId })._id,
            date: (booking.availabilityId as { date?: Date }).date,
            availableSlots: (booking.availabilityId as { availableSlots?: number }).availableSlots,
            bookedSlots: (booking.availabilityId as { bookedSlots?: number }).bookedSlots,
          }
        : undefined,
      availabilities:
        Array.isArray(booking.availabilityIds) && booking.availabilityIds.length > 0
          ? (booking.availabilityIds as { _id: mongoose.Types.ObjectId; date?: Date }[]).map((a) => ({
              _id: a._id,
              date: a.date,
            }))
          : undefined,
      payment: {
        amount: booking.payment.amount,
        merchantAmount: booking.payment.merchantAmount,
        triplyCommission: booking.payment.triplyCommission,
        currency: booking.payment.currency,
        paymentStatus: booking.payment.paymentStatus,
        merchantPayoutStatus: booking.payment.merchantPayoutStatus,
        merchantPayoutDate: booking.payment.merchantPayoutDate,
        paidAt: booking.payment.paidAt,
      },
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
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
    const { page = '1', limit = '10', status, attention, search } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
      attention?: string;
      search?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    // Get merchant's activities
    const activities = await Activity.find({ merchantId: userId });
    const activityIds = activities.map((a) => a._id);

    const andParts: Record<string, unknown>[] = [{ activityId: { $in: activityIds } }];

    if (attention === 'availability') {
      const approvedIds = await Activity.find({ merchantId: userId, status: 'approved' }).distinct(
        '_id'
      );
      const allowed = approvedIds.filter((id) =>
        activityIds.some((aid) => aid.toString() === id.toString())
      );
      andParts.push({ activityId: { $in: allowed.length ? allowed : [] } });
      andParts.push({ status: 'pending_payment' });
      andParts.push({ merchantAvailabilityApproved: { $ne: true } });
    } else if (attention === 'confirm_booking') {
      andParts.push({ status: 'payment_completed' });
    } else if (attention === 'awaiting_guest') {
      andParts.push({ status: 'pending_payment' });
      andParts.push({ merchantAvailabilityApproved: true });
      andParts.push({ 'payment.paymentStatus': 'pending' });
    } else if (status) {
      andParts.push({ status });
    }

    const searchTrimmed = typeof search === 'string' ? search.trim() : '';
    if (searchTrimmed.length > 0) {
      const escaped = searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      const titleMatchIds = await Activity.find({
        merchantId: userId,
        title: re,
      }).distinct('_id');
      andParts.push({
        $or: [
          { bookingReference: re },
          { customerName: re },
          { customerEmail: re },
          ...(titleMatchIds.length ? [{ activityId: { $in: titleMatchIds } }] : []),
        ],
      });
    }

    const query = andParts.length === 1 ? andParts[0] : { $and: andParts };

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      ActivityBooking.find(query)
        .populate('activityId', 'title photos status')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityBooking.countDocuments(query),
    ]);

    const bookingsData = bookings.map((booking) => ({
      _id: booking._id,
      bookingReference: booking.bookingReference,
      merchantAvailabilityApproved: Boolean(booking.merchantAvailabilityApproved),
      activity: {
        _id: (booking.activityId as any)?._id,
        title: (booking.activityId as any)?.title,
        photos: (booking.activityId as any)?.photos || [],
        status: (booking.activityId as any)?.status,
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
        paidAt: booking.payment.paidAt,
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
