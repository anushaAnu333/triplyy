import { Response, NextFunction } from 'express';
import { Booking, Destination, Availability, AffiliateCode } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, BookingFilters } from '../types/custom';
import { createPaymentIntent } from '../services/paymentService';
import {
  notifyDepositPaid,
  notifyBookingConfirmed,
  notifyBookingRejected,
  notifyAdminDatesSelected,
} from '../services/notificationService';
import { generateBookingsReport, convertToCSV } from '../services/reportService';
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
    const { destinationId, numberOfTravellers, specialRequests, affiliateCode } = req.body;
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

    // Create booking
    const booking = await Booking.create({
      userId,
      destinationId,
      numberOfTravellers: numberOfTravellers || 1,
      specialRequests,
      affiliateCode: affiliateCode?.toUpperCase(),
      affiliateId,
      status: 'pending_deposit',
      depositPayment: {
        amount: destination.depositAmount || env.DEFAULT_DEPOSIT_AMOUNT,
        currency: destination.currency || env.DEFAULT_CURRENCY,
        paymentStatus: 'pending',
      },
    });

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      bookingId: booking._id.toString(),
      amount: booking.depositPayment.amount,
      currency: booking.depositPayment.currency,
      metadata: {
        bookingReference: booking.bookingReference,
        userId,
      },
    });

    createdResponse(res, 'Booking created successfully', {
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        depositAmount: booking.depositPayment.amount,
        currency: booking.depositPayment.currency,
      },
      payment: {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
      },
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
      .populate('userId', 'firstName lastName email phoneNumber');

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
    const end = new Date(endDate);

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

    // Update booking
    booking.travelDates = {
      startDate: start,
      endDate: end,
      isFlexible: isFlexible || false,
    };
    booking.status = 'dates_selected';
    await booking.save();

    // Notify admin
    await notifyAdminDatesSelected(booking._id.toString());

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

      const csv = convertToCSV(reportData, headers);

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

