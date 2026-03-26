import { Request, Response, NextFunction } from 'express';
import { Activity, ActivityInquiry, ActivityAvailability, ActivityBooking, MerchantOnboarding, User } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { sendEmail } from '../services/emailService';
import { AuthRequest } from '../types/custom';
import env from '../config/environment';

/**
 * Get all approved activities (Public)
 * GET /api/v1/activities
 */
export const getActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '12', location, search } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 12, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build query - only approved activities
    const query: Record<string, unknown> = { status: 'approved' };

    if (location) {
      const locationStr = location as string;
      
      // Create a mapping for country to cities (for better matching)
      const countryCityMap: Record<string, string[]> = {
        'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'],
        'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'],
      };
      
      // If location matches a country, also search for cities in that country
      const cities = countryCityMap[locationStr] || [];
      const allSearchTerms = [locationStr, ...cities];
      
      // Use $or to match any of the location terms
      query.$or = allSearchTerms.map(term => ({
        location: { $regex: term, $options: 'i' }
      }));
    }

    if (search) {
      // If location filter already exists, we need to combine with $and
      const searchConditions = [
        { title: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { location: { $regex: search as string, $options: 'i' } },
      ];
      
      if (query.$or) {
        // Both location and search: location must match AND search must match
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        // Only search filter
        query.$or = searchConditions;
      }
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('merchantId', 'firstName lastName')
        .select('title description location price currency photos createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Activity.countDocuments(query),
    ]);

    successResponse(
      res,
      'Activities retrieved successfully',
      activities,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity by ID (Public)
 * GET /api/v1/activities/:id
 */
export const getActivityById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const activity = await Activity.findOne({ _id: id, status: 'approved' })
      .populate('merchantId', 'firstName lastName email phoneNumber');

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    successResponse(res, 'Activity retrieved successfully', activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit activity inquiry/booking (Public)
 * POST /api/v1/activities/:id/inquire
 */
export const submitInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerName, customerEmail, customerPhone, preferredDate, message } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !preferredDate) {
      throw new AppError(
        'Customer name, email, phone, and preferred date are required',
        400
      );
    }

    // Check if activity exists and is approved
    const activity = await Activity.findOne({ _id: id, status: 'approved' })
      .populate('merchantId');

    if (!activity) {
      throw new AppError('Activity not found or not available', 404);
    }

    // Create inquiry
    const inquiry = await ActivityInquiry.create({
      activityId: activity._id,
      customerName,
      customerEmail,
      customerPhone,
      preferredDate: new Date(preferredDate),
      message: message || '',
    });

    // Get merchant details
    const merchant = activity.merchantId as unknown as typeof User;

    // Send email to merchant
    const merchantEmailHtml = `
      <h2>New Activity Inquiry</h2>
      <p>You have received a new inquiry for your activity: <strong>${activity.title}</strong></p>
      <hr>
      <h3>Customer Details:</h3>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <hr>
      <p>Please contact the customer to confirm the booking.</p>
    `;

    await sendEmail({
      to: (merchant as any).email,
      subject: `New Inquiry for ${activity.title}`,
      html: merchantEmailHtml,
      emailType: 'activity_inquiry',
    });

    // Send email to admin
    const adminEmailHtml = `
      <h2>New Activity Inquiry Notification</h2>
      <p>A new inquiry has been submitted for activity: <strong>${activity.title}</strong></p>
      <hr>
      <h3>Activity Details:</h3>
      <p><strong>Title:</strong> ${activity.title}</p>
      <p><strong>Location:</strong> ${activity.location}</p>
      <p><strong>Price:</strong> ${activity.currency} ${activity.price}</p>
      <p><strong>Merchant:</strong> ${(merchant as any).firstName} ${(merchant as any).lastName}</p>
      <hr>
      <h3>Customer Details:</h3>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
    `;

    // Get admin email (you might want to get this from environment or database)
    const adminUsers = await User.find({ role: 'admin' }).select('email');
    const adminEmails = adminUsers.map((admin) => admin.email);

    if (adminEmails.length > 0) {
      await Promise.all(
        adminEmails.map((email) =>
          sendEmail({
            to: email,
            subject: `New Activity Inquiry - ${activity.title}`,
            html: adminEmailHtml,
            emailType: 'activity_inquiry',
          })
        )
      );
    }

    // Send confirmation email to customer
    const customerEmailHtml = `
      <h2>Thank you for your inquiry!</h2>
      <p>We have received your inquiry for <strong>${activity.title}</strong>.</p>
      <hr>
      <h3>Your Inquiry Details:</h3>
      <p><strong>Activity:</strong> ${activity.title}</p>
      <p><strong>Location:</strong> ${activity.location}</p>
      <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
      <hr>
      <p>The activity operator will contact you shortly to confirm your booking.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `;

    await sendEmail({
      to: customerEmail,
      subject: `Inquiry Confirmation - ${activity.title}`,
      html: customerEmailHtml,
      emailType: 'activity_inquiry',
    });

    createdResponse(res, 'Inquiry submitted successfully. You will be contacted shortly.', inquiry);
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability calendar for an activity
 * GET /api/v1/activities/:id/availability
 */
export const getActivityAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if activity exists and is approved
    const activity = await Activity.findOne({ _id: id, status: 'approved' });

    if (!activity) {
      throw new AppError('Activity not found or not available', 404);
    }

    // Default to next 90 days if no date range provided
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    // Get availability for the date range
    const availability = await ActivityAvailability.find({
      activityId: id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    successResponse(res, 'Availability retrieved successfully', {
      activityId: id,
      availability,
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create activity booking with payment
 * POST /api/v1/activities/:id/book
 */
export const createActivityBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      selectedDate,
      selectedDates: selectedDatesBody,
      numberOfParticipants,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
    } = req.body;
    const userId = req.user.userId;

    // Build unique calendar days: prefer `selectedDates` array (one booking for all days)
    const rawDates: unknown[] = Array.isArray(selectedDatesBody) && selectedDatesBody.length > 0
      ? selectedDatesBody
      : selectedDate
        ? [selectedDate]
        : [];

    if (rawDates.length === 0 || !numberOfParticipants || !customerName || !customerEmail) {
      throw new AppError(
        'At least one selected date, number of participants, customer name and email are required',
        400
      );
    }

    // Activity can be pending, but we only allow payment after admin approval.
    // If activity is rejected, we can't create bookings.
    const activity = await Activity.findOne({ _id: id }).populate('merchantId');

    if (!activity) {
      throw new AppError('Activity not found or not available', 404);
    }

    if (activity.status === 'rejected') {
      throw new AppError('Activity is not available for booking', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const uniqueByDay = new Map<string, Date>();
    for (const raw of rawDates) {
      const bookingDate = new Date(raw as string);
      if (Number.isNaN(bookingDate.getTime())) {
        throw new AppError('Invalid date in selection', 400);
      }
      bookingDate.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        throw new AppError('Cannot book activities in the past', 400);
      }
      uniqueByDay.set(dayKey(bookingDate), bookingDate);
    }

    const sortedDates = Array.from(uniqueByDay.values()).sort((a, b) => a.getTime() - b.getTime());

    const availabilityDocs: InstanceType<typeof ActivityAvailability>[] = [];
    let totalAmount = 0;

    for (const bookingDate of sortedDates) {
      let availability = await ActivityAvailability.findOne({
        activityId: id,
        date: bookingDate,
      });

      if (!availability) {
        availability = await ActivityAvailability.create({
          activityId: id,
          date: bookingDate,
          availableSlots: 999,
          bookedSlots: 0,
          isAvailable: true,
        });
      }

      if (!availability.isAvailable) {
        throw new AppError(`Date ${bookingDate.toISOString().slice(0, 10)} is not available for booking`, 400);
      }

      const remainingSlots = availability.availableSlots - availability.bookedSlots;
      if (numberOfParticipants > remainingSlots) {
        throw new AppError(
          `Only ${remainingSlots} slot(s) available on ${bookingDate.toISOString().slice(0, 10)}. You requested ${numberOfParticipants}.`,
          400
        );
      }

      const price = availability.price || activity.price;
      totalAmount += price * numberOfParticipants;
      availabilityDocs.push(availability);
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const triplyCommission = Math.round((totalAmount * 0.2) * 100) / 100;
    const merchantAmount = Math.round((totalAmount * 0.8) * 100) / 100;

    const { generateBookingReference } = require('../utils/generateReference');
    const bookingReference = generateBookingReference();

    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    const firstAvailability = availabilityDocs[0];
    const availabilityIdList = availabilityDocs.map((a) => a._id);

    const booking = await ActivityBooking.create({
      bookingReference,
      userId,
      activityId: id,
      availabilityId: firstAvailability._id,
      availabilityIds: availabilityIdList,
      selectedDate: firstDate,
      selectedDates: sortedDates,
      lastActivityDate: lastDate,
      numberOfParticipants,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      specialRequests: specialRequests || undefined,
      status: 'pending_payment',
      payment: {
        amount: totalAmount,
        currency: activity.currency,
        triplyCommission,
        merchantAmount,
        paymentStatus: 'pending',
        merchantPayoutStatus: 'pending',
      },
    });

    for (const availability of availabilityDocs) {
      availability.bookedSlots += numberOfParticipants;
      await availability.save();
    }

    createdResponse(res, 'Booking created successfully. Please proceed to payment.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity booking by ID
 * GET /api/v1/activities/bookings/:bookingId
 */
export const getActivityBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const query: Record<string, unknown> = { _id: bookingId };
    if (!isAdmin) {
      query.userId = userId;
    }

    const booking = await ActivityBooking.findOne(query)
      .populate('activityId', 'title description location photos price currency merchantId status')
      .populate('availabilityId', 'date availableSlots bookedSlots')
      .populate('availabilityIds', 'date availableSlots bookedSlots')
      .populate('userId', 'firstName lastName email phoneNumber');

    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    successResponse(res, 'Activity booking retrieved successfully', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: get full booking detail including merchant payout/account context
 * GET /api/v1/activities/bookings/admin/:bookingId
 */
export const getAdminActivityBookingDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Only admins can access this resource', 403);
    }

    const { bookingId } = req.params;
    const booking = await ActivityBooking.findById(bookingId)
      .populate('activityId', 'title description location photos price currency merchantId status duration groupSize languages')
      .populate('activityId.merchantId', 'firstName lastName email phoneNumber')
      .populate('availabilityId', 'date availableSlots bookedSlots')
      .populate('availabilityIds', 'date availableSlots bookedSlots')
      .populate('userId', 'firstName lastName email phoneNumber')
      .select('-__v');

    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    const activityObj = booking.activityId as unknown as { merchantId?: unknown };
    const populatedMerchant = activityObj?.merchantId as any | undefined;
    // If nested populate partially returns only _id, we still want to fetch merchant details from User.
    const merchantId =
      populatedMerchant?._id ??
      (typeof populatedMerchant === 'string' ? populatedMerchant : (populatedMerchant as any));

    let merchantOnboarding: {
      businessType?: string;
      categories?: string[];
      businessInfo?: Record<string, unknown>;
      updatedAt?: Date;
    } | null = null;

    const merchant =
      merchantId
        ? await User.findById(merchantId).select('firstName lastName email phoneNumber')
        : null;

    if (merchantId) {
      const onboarding = await MerchantOnboarding.findOne({
        userId: merchantId,
        status: 'approved',
      })
        .sort({ updatedAt: -1 })
        .select('businessType categories businessInfo updatedAt');
      merchantOnboarding = onboarding
        ? {
            businessType: onboarding.businessType,
            categories: onboarding.categories,
            businessInfo: onboarding.businessInfo as Record<string, unknown>,
            updatedAt: onboarding.updatedAt,
          }
        : null;
    }

    successResponse(res, 'Admin activity booking detail retrieved successfully', {
      booking,
      merchant: merchant ?? null,
      merchantOnboarding,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's activity bookings
 * GET /api/v1/activities/my-bookings
 */
export const getMyActivityBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { userId };

    const [bookings, total] = await Promise.all([
      ActivityBooking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('activityId', 'title location photos price currency merchantId status')
        .populate('availabilityId', 'date availableSlots bookedSlots')
        .populate('availabilityIds', 'date availableSlots bookedSlots')
        .select('-__v'),
      ActivityBooking.countDocuments(query),
    ]);

    successResponse(res, 'Activity bookings retrieved successfully', bookings, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an activity booking (payment_completed -> confirmed)
 * PUT /api/v1/activities/bookings/:bookingId/confirm
 *
 * Admin can confirm any booking.
 * Merchant can confirm bookings for their own activities.
 */
export const confirmActivityBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const booking = await ActivityBooking.findById(bookingId).populate('activityId', 'merchantId');
    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    const isAdmin = role === 'admin';
    if (!isAdmin) {
      const merchantId = (booking.activityId as any)?.merchantId;
      if (!merchantId || String(merchantId) !== String(userId)) {
        throw new AppError('Activity booking not found', 404);
      }
    }

    if (booking.status !== 'payment_completed') {
      throw new AppError('Booking must be payment completed before approval', 400);
    }

    booking.status = 'confirmed';
    await booking.save();

    successResponse(res, 'Activity booking confirmed successfully', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: mark merchant payout as paid after trip completed (manual bank transfer recorded).
 * PUT /api/v1/activities/bookings/:bookingId/mark-merchant-payout-paid
 *
 * Body: { paymentReference?: string } — optional note (e.g. bank ref, Stripe transfer id).
 */
export const markMerchantPayoutPaidAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Only admins can mark merchant payouts', 403);
    }

    const { bookingId } = req.params;
    const paymentReference =
      typeof req.body?.paymentReference === 'string' ? req.body.paymentReference.trim() : '';

    const booking = await ActivityBooking.findById(bookingId);
    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    if (booking.status !== 'confirmed') {
      throw new AppError('Booking must be confirmed before recording merchant payout', 400);
    }
    if (booking.payment.paymentStatus !== 'completed') {
      throw new AppError('Guest payment must be completed first', 400);
    }
    if (booking.payment.merchantPayoutStatus !== 'pending') {
      throw new AppError('Merchant payout is already recorded as paid', 400);
    }

    const tripEnd = booking.lastActivityDate || booking.selectedDate;
    if (!tripEnd) {
      throw new AppError('Booking has no activity date', 400);
    }
    const endOfTripDay = new Date(tripEnd);
    endOfTripDay.setHours(23, 59, 59, 999);
    if (endOfTripDay > new Date()) {
      throw new AppError(
        'Trip must be completed (activity date in the past) before recording merchant payout',
        400
      );
    }

    const now = new Date();
    booking.payment.merchantPayoutStatus = 'paid';
    booking.payment.merchantPayoutDate = now;
    if (paymentReference.length > 0) {
      booking.payment.merchantPayoutTransactionId = paymentReference.slice(0, 200);
    }
    await booking.save();

    successResponse(res, 'Merchant payout marked as paid', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: get all activity bookings (with optional status filter)
 * GET /api/v1/activities/bookings/admin?status=payment_completed&page=1&limit=10
 */
export const getAdminActivityBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    if (role !== 'admin') {
      throw new AppError('Only admins can access this resource', 403);
    }

    const { page = '1', limit = '10', status } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      ActivityBooking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('activityId', 'title location photos price currency merchantId status')
        .populate('activityId.merchantId', 'firstName lastName email')
        .populate('availabilityId', 'date availableSlots bookedSlots')
        .populate('availabilityIds', 'date availableSlots bookedSlots')
        .populate('userId', 'firstName lastName email phoneNumber')
        .select('-__v'),
      ActivityBooking.countDocuments(query),
    ]);

    successResponse(
      res,
      'Activity bookings retrieved successfully',
      bookings,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an activity booking (pending_payment -> cancelled)
 * PUT /api/v1/activities/bookings/:bookingId/cancel
 */
export const cancelActivityBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const booking = await ActivityBooking.findById(bookingId).populate('activityId', 'merchantId');
    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    // Only the booking owner (user) or admin can cancel.
    if (role !== 'admin') {
      if (String(booking.userId) !== String(userId)) {
        throw new AppError('Activity booking not found', 404);
      }
    }

    if (booking.status !== 'pending_payment') {
      throw new AppError('Only pending activity bookings can be cancelled', 400);
    }

    // Release reserved slots (all days for multi-day bookings).
    const idsToRelease =
      booking.availabilityIds && booking.availabilityIds.length > 0
        ? booking.availabilityIds
        : booking.availabilityId
          ? [booking.availabilityId]
          : [];
    for (const aid of idsToRelease) {
      const availability = await ActivityAvailability.findById(aid);
      if (availability) {
        const nextBookedSlots = (availability.bookedSlots || 0) - booking.numberOfParticipants;
        availability.bookedSlots = Math.max(nextBookedSlots, 0);
        await availability.save();
      }
    }

    booking.status = 'cancelled';
    await booking.save();

    successResponse(res, 'Activity booking cancelled successfully', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};
