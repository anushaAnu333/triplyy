import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Booking, Destination, Availability, AffiliateCode, User, ActivityBooking, Activity, ActivityAvailability } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, BookingFilters } from '../types/custom';
import { createPaymentIntent } from '../services/paymentService';
import logger from '../utils/logger';
import {
  notifyDepositPaid,
  notifyBookingConfirmed,
  notifyBookingRejected,
  notifyAdminDatesSelected,
  notifyUserDatesSelected,
} from '../services/notificationService';
import { generateBookingsReport, convertToCSV } from '../services/reportService';
import { generateBookingReference } from '../utils/generateReference';
import env from '../config/environment';

/**
 * Create new booking
 * POST /api/v1/bookings
 */
export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId, numberOfTravellers, specialRequests, affiliateCode, activities } = req.body;
    const userId = req.user.userId;

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination || !destination.isActive) {
      throw new AppError('Destination not found or not available', 404);
    }

    // Validate affiliate code if provided
    let affiliateId: string | undefined;
    if (affiliateCode) {
      const affiliate = await AffiliateCode.findOne({
        code: affiliateCode.toUpperCase(),
        isActive: true,
      });

      if (!affiliate) {
        throw new AppError('Invalid affiliate code', 400);
      }

      // Prevent self-referral
      if (affiliate.affiliateId.toString() === userId) {
        throw new AppError('You cannot use your own affiliate code', 400);
      }

      affiliateId = affiliate.affiliateId.toString();
    }

    // Get user to check for referral discount and use for activity bookings
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    let depositAmount = destination.depositAmount || env.DEFAULT_DEPOSIT_AMOUNT;
    
    // Apply referral discount if user has one
    if (user?.discountAmount) {
      depositAmount = Math.max(0, depositAmount - user.discountAmount);
    }

    // Validate deposit amount (must be at least 0.50 AED)
    if (depositAmount < 0.5) {
      throw new AppError('Deposit amount is too small after discount. Minimum amount is 0.50 AED.', 400);
    }

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const booking = await Booking.create({
      userId,
      destinationId,
      bookingReference,
      numberOfTravellers: numberOfTravellers || 1,
      specialRequests,
      affiliateCode: affiliateCode?.toUpperCase(),
      affiliateId,
      status: 'pending_deposit',
      depositPayment: {
        amount: depositAmount,
        currency: destination.currency || env.DEFAULT_CURRENCY,
        paymentStatus: 'pending',
      },
    });

    // Handle activity bookings if provided
    const linkedActivityBookings: string[] = [];
    let totalActivityAmount = 0;
    const activityBookings = [];

    if (activities && Array.isArray(activities) && activities.length > 0) {
      for (const activityData of activities) {
        const { activityId, selectedDate, numberOfParticipants, customerName, customerEmail, customerPhone, specialRequests: activitySpecialRequests } = activityData;

        // Validate activity exists
        const activity = await Activity.findOne({ _id: activityId, status: 'approved' })
          .populate('merchantId');
        
        if (!activity) {
          throw new AppError(`Activity ${activityId} not found or not approved`, 404);
        }

        const bookingDate = new Date(selectedDate);
        bookingDate.setHours(0, 0, 0, 0);

        // Find or create availability
        let availability = await ActivityAvailability.findOne({
          activityId: activityId,
          date: bookingDate,
        });

        if (!availability) {
          availability = await ActivityAvailability.create({
            activityId: activityId,
            date: bookingDate,
            availableSlots: 999,
            bookedSlots: 0,
            isAvailable: true,
          });
        }

        // Calculate price
        const price = availability.price || activity.price;
        const totalAmount = price * numberOfParticipants;
        const triplyCommission = Math.round((totalAmount * 0.2) * 100) / 100;
        const merchantAmount = Math.round((totalAmount * 0.8) * 100) / 100;

        // Create activity booking
        const activityBooking = await ActivityBooking.create({
          userId,
          activityId: activityId,
          availabilityId: availability._id,
          selectedDate: bookingDate,
          numberOfParticipants,
          customerName: customerName || `${user.firstName} ${user.lastName}`,
          customerEmail: customerEmail || user.email,
          customerPhone: customerPhone || user.phoneNumber,
          specialRequests: activitySpecialRequests,
          status: 'pending_payment',
          linkedDestinationBookingId: booking._id,
          isAddOn: true,
          payment: {
            amount: totalAmount,
            currency: activity.currency,
            triplyCommission,
            merchantAmount,
            paymentStatus: 'pending',
            merchantPayoutStatus: 'pending',
          },
        });

        linkedActivityBookings.push(activityBooking._id.toString());
        totalActivityAmount += totalAmount;
        activityBookings.push(activityBooking);
      }

      // Update booking with linked activities
      booking.linkedActivityBookings = linkedActivityBookings.map(id => new mongoose.Types.ObjectId(id));
      await booking.save();
    }

    // Calculate total amount (destination deposit + activities)
    const totalAmount = depositAmount + totalActivityAmount;

    // Create payment intent for combined amount
    const paymentIntent = await createPaymentIntent({
      bookingId: booking._id.toString(),
      amount: totalAmount,
      currency: booking.depositPayment.currency,
      metadata: {
        bookingReference: booking.bookingReference,
        userId,
        hasActivities: activities && activities.length > 0,
        activityCount: activities?.length || 0,
      },
    });

    createdResponse(res, 'Booking created successfully', {
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        depositAmount: booking.depositPayment.amount,
        currency: booking.depositPayment.currency,
        totalAmount,
        activityAmount: totalActivityAmount,
        hasActivities: activities && activities.length > 0,
      },
      payment: {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
      },
      activities: activityBookings.map(ab => ({
        id: ab._id,
        bookingReference: ab.bookingReference,
        amount: ab.payment.amount,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's bookings
 * GET /api/v1/bookings/my-bookings
 */
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10', status } = req.query as BookingFilters;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { userId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('destinationId', 'name slug thumbnailImage country duration')
        .select('-adminNotes')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ]);

    successResponse(
      res,
      'Bookings retrieved successfully',
      bookings,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details
 * GET /api/v1/bookings/:id
 */
export const getBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const query: Record<string, unknown> = { _id: id };
    if (!isAdmin) {
      query.userId = userId;
    }

    const booking = await Booking.findOne(query)
      .populate('destinationId', 'name slug description images thumbnailImage country duration highlights inclusions exclusions')
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate({
        path: 'linkedActivityBookings',
        populate: {
          path: 'activityId',
          select: 'title description location photos price currency',
        },
      });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    successResponse(res, 'Booking retrieved successfully', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Select travel dates
 * PUT /api/v1/bookings/:id/select-dates
 */
export const selectDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, isFlexible } = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findOne({ _id: id, userId });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify booking status allows date selection
    if (booking.status !== 'deposit_paid') {
      throw new AppError('Cannot select dates for this booking. Deposit must be paid first.', 400);
    }

    // Verify calendar is still unlocked
    if (booking.calendarUnlockedUntil && booking.calendarUnlockedUntil < new Date()) {
      throw new AppError('Calendar access has expired. Please contact support.', 400);
    }

    // Check availability for selected dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all availability records for the date range
    const allAvailability = await Availability.find({
      destinationId: booking.destinationId,
      date: { $gte: start, $lte: end },
    });

    // Check for blocked dates or fully booked dates
    const blockedDates: Date[] = [];
    const fullyBookedDates: Date[] = [];

    allAvailability.forEach((avail) => {
      if (avail.isBlocked) {
        blockedDates.push(avail.date);
      } else if (avail.bookedSlots >= avail.availableSlots) {
        fullyBookedDates.push(avail.date);
      }
    });

    // If flexible dates are allowed, check if dates within ±2 days are available
    if (isFlexible && (blockedDates.length > 0 || fullyBookedDates.length > 0)) {
      // For flexible dates, we allow the booking even if some dates are unavailable
      // Admin can adjust dates during confirmation
      logger.info(`[BOOKING] Flexible dates selected with some unavailable dates. Booking will proceed for admin review.`);
    } else if (blockedDates.length > 0 || fullyBookedDates.length > 0) {
      // If not flexible and there are blocked/fully booked dates, reject
      const blockedCount = blockedDates.length;
      const fullyBookedCount = fullyBookedDates.length;
      
      let errorMessage = 'Selected dates are not fully available. ';
      if (blockedCount > 0 && fullyBookedCount > 0) {
        errorMessage += `${blockedCount} date(s) are blocked and ${fullyBookedCount} date(s) are fully booked. `;
      } else if (blockedCount > 0) {
        errorMessage += `${blockedCount} date(s) are blocked. `;
      } else {
        errorMessage += `${fullyBookedCount} date(s) are fully booked. `;
      }
      errorMessage += 'Please choose different dates or enable flexible dates.';
      
      throw new AppError(errorMessage, 400);
    }

    // If no availability records exist for the dates, that's okay - admin can set them later
    // We only block if dates are explicitly blocked or fully booked

    // Update booking
    booking.travelDates = {
      startDate: start,
      endDate: end,
      isFlexible: isFlexible || false,
    };
    booking.status = 'dates_selected';
    await booking.save();

    // Notify admin and user
    await notifyAdminDatesSelected(booking._id.toString());
    await notifyUserDatesSelected(booking._id.toString());

    successResponse(res, 'Travel dates selected successfully. Awaiting confirmation.', {
      bookingReference: booking.bookingReference,
      status: booking.status,
      travelDates: booking.travelDates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 * PUT /api/v1/bookings/:id/cancel
 */
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findOne({ _id: id, userId });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Only allow cancellation for certain statuses
    const cancellableStatuses = ['pending_deposit', 'deposit_paid', 'dates_selected'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError('This booking cannot be cancelled', 400);
    }

    booking.status = 'cancelled';
    await booking.save();

    // If deposit was paid, initiate refund process
    // In production, this would trigger actual refund via paymentService

    successResponse(res, 'Booking cancelled successfully', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Admin Routes ====================

/**
 * Get all bookings (Admin)
 * GET /api/v1/bookings/admin/all
 */
export const getAllBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      destinationId,
      userId,
      dateFrom,
      dateTo,
      affiliateCode,
    } = req.query as BookingFilters;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (destinationId) query.destinationId = destinationId;
    if (userId) query.userId = userId;
    if (affiliateCode) query.affiliateCode = affiliateCode.toUpperCase();

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.createdAt as Record<string, Date>).$lte = new Date(dateTo);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('destinationId', 'name slug thumbnailImage country')
        .populate('userId', 'firstName lastName email phoneNumber')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ]);

    successResponse(
      res,
      'Bookings retrieved successfully',
      bookings,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm booking (Admin)
 * PUT /api/v1/bookings/admin/:id/confirm
 */
export const confirmBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== 'dates_selected') {
      throw new AppError('Booking must have dates selected before confirmation', 400);
    }

    // Update booked slots for selected dates
    if (booking.travelDates.startDate && booking.travelDates.endDate) {
      await Availability.updateMany(
        {
          destinationId: booking.destinationId,
          date: {
            $gte: booking.travelDates.startDate,
            $lte: booking.travelDates.endDate,
          },
        },
        { $inc: { bookedSlots: 1 } }
      );
    }

    booking.status = 'confirmed';
    await booking.save();

    // Send confirmation notification
    await notifyBookingConfirmed(booking._id.toString());

    successResponse(res, 'Booking confirmed successfully', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject booking (Admin)
 * PUT /api/v1/bookings/admin/:id/reject
 */
export const rejectBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'confirmed' || booking.status === 'cancelled') {
      throw new AppError('This booking cannot be rejected', 400);
    }

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason;
    await booking.save();

    // Send rejection notification
    await notifyBookingRejected(booking._id.toString(), rejectionReason);

    successResponse(res, 'Booking rejected', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking dates (Admin)
 * PUT /api/v1/bookings/admin/:id/update-dates
 */
export const updateBookingDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, isFlexible } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check availability for selected dates
    const availabilityCheck = await Availability.find({
      destinationId: booking.destinationId,
      date: { $gte: start, $lte: end },
      isBlocked: false,
      $expr: { $gt: ['$availableSlots', '$bookedSlots'] },
    });

    // Calculate expected days
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (availabilityCheck.length < daysDiff) {
      throw new AppError('Selected dates are not fully available. Please choose different dates.', 400);
    }

    // Update booking dates
    booking.travelDates = {
      startDate: start,
      endDate: end,
      isFlexible: isFlexible || false,
    };

    // If dates weren't selected before, update status
    if (booking.status === 'deposit_paid') {
      booking.status = 'dates_selected';
    }

    await booking.save();

    // Notify user of date update
    await notifyUserDatesSelected(booking._id.toString());

    successResponse(res, 'Booking dates updated successfully', {
      bookingReference: booking.bookingReference,
      travelDates: booking.travelDates,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add admin notes (Admin)
 * PUT /api/v1/bookings/admin/:id/notes
 */
export const addAdminNotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { adminNotes },
      { new: true }
    );

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    successResponse(res, 'Admin notes updated', {
      bookingReference: booking.bookingReference,
      adminNotes: booking.adminNotes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export bookings report (Admin)
 * GET /api/v1/bookings/admin/export
 */
export const exportBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, status, destinationId, format = 'csv' } = req.query;

    const reportData = await generateBookingsReport({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      destinationId: destinationId as string,
    });

    if (format === 'csv') {
      const headers = [
        'bookingReference',
        'customerName',
        'customerEmail',
        'destination',
        'status',
        'depositAmount',
        'paymentStatus',
        'travelStartDate',
        'travelEndDate',
        'affiliateCode',
        'createdAt',
      ];

      const csv = convertToCSV(reportData as unknown as Record<string, unknown>[], headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.csv');
      res.send(csv);
    } else {
      successResponse(res, 'Bookings report generated', reportData);
    }
  } catch (error) {
    next(error);
  }
};

