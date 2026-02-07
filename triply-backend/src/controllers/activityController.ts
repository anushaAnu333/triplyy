import { Request, Response, NextFunction } from 'express';
import { Activity, ActivityInquiry, ActivityAvailability, ActivityBooking, User } from '../models';
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
    const { selectedDate, numberOfParticipants, customerName, customerEmail, customerPhone, specialRequests } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!selectedDate || !numberOfParticipants || !customerName || !customerEmail) {
      throw new AppError('Selected date, number of participants, customer name and email are required', 400);
    }

    // Check if activity exists and is approved
    const activity = await Activity.findOne({ _id: id, status: 'approved' })
      .populate('merchantId');

    if (!activity) {
      throw new AppError('Activity not found or not available', 404);
    }

    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      throw new AppError('Cannot book activities in the past', 400);
    }

    // Find or create availability for this date
    let availability = await ActivityAvailability.findOne({
      activityId: id,
      date: bookingDate,
    });

    if (!availability) {
      // Create default availability (unlimited slots)
      availability = await ActivityAvailability.create({
        activityId: id,
        date: bookingDate,
        availableSlots: 999, // Default to unlimited
        bookedSlots: 0,
        isAvailable: true,
      });
    }

    // Check if available
    if (!availability.isAvailable) {
      throw new AppError('This date is not available for booking', 400);
    }

    const remainingSlots = availability.availableSlots - availability.bookedSlots;
    if (numberOfParticipants > remainingSlots) {
      throw new AppError(
        `Only ${remainingSlots} slot(s) available. You requested ${numberOfParticipants}.`,
        400
      );
    }

    // Calculate price (use date-specific price if available, otherwise use activity price)
    const price = availability.price || activity.price;
    const totalAmount = price * numberOfParticipants;

    // Calculate commission (20% to Triply, 80% to merchant)
    const triplyCommission = Math.round((totalAmount * 0.2) * 100) / 100;
    const merchantAmount = Math.round((totalAmount * 0.8) * 100) / 100;

    // Generate booking reference before creating
    const { generateBookingReference } = require('../utils/generateReference');
    const bookingReference = generateBookingReference();

    // Create booking
    const booking = await ActivityBooking.create({
      bookingReference,
      userId,
      activityId: id,
      availabilityId: availability._id,
      selectedDate: bookingDate,
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

    // Update availability booked slots (reserve the slots)
    availability.bookedSlots += numberOfParticipants;
    await availability.save();

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
      .populate('activityId', 'title description location photos price currency merchantId')
      .populate('availabilityId', 'date availableSlots bookedSlots')
      .populate('userId', 'firstName lastName email phoneNumber');

    if (!booking) {
      throw new AppError('Activity booking not found', 404);
    }

    successResponse(res, 'Activity booking retrieved successfully', booking);
  } catch (error) {
    next(error);
  }
};
