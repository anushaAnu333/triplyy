import { Response, NextFunction } from 'express';
import { Package, PackageBooking } from '../models';
import { successResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';

/**
 * Package catalogue is enquiry-led (call / WhatsApp / email). Online deposit booking is disabled.
 * POST /api/v1/package-bookings — returns 403
 */
export const createPackageBooking = async (
  _req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    throw new AppError(
      'Package bookings are not available online. Please contact us using the details on the package page.',
      403
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List current user's package bookings
 * GET /api/v1/package-bookings/my
 */
export const getMyPackageBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const [rows, total] = await Promise.all([
      PackageBooking.find({ userId })
        .populate('packageId', 'name slug thumbnailImage location priceLabel priceCurrency')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      PackageBooking.countDocuments({ userId }),
    ]);

    successResponse(res, 'Package bookings retrieved', rows, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * Get single package booking (owner or admin)
 * GET /api/v1/package-bookings/:id
 */
export const getPackageBookingById = async (
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

    const booking = await PackageBooking.findOne(query).populate('packageId').lean();

    if (!booking) {
      throw new AppError('Package booking not found', 404);
    }

    successResponse(res, 'Package booking retrieved', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: list package bookings with filters
 * GET /api/v1/admin/package-bookings
 */
export const adminListPackageBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    if (status && typeof status === 'string') {
      query.status = status;
    }

    const [rows, total] = await Promise.all([
      PackageBooking.find(query)
        .populate('packageId', 'name slug location')
        .populate('userId', 'firstName lastName email')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      PackageBooking.countDocuments(query),
    ]);

    successResponse(res, 'Package bookings retrieved', rows, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: assign travel dates (after booking paid — pending_date)
 * PATCH /api/v1/admin/package-bookings/:id/assign-dates
 */
export const adminAssignPackageTravelDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, adminNotes } = req.body as {
      startDate?: string;
      endDate?: string;
      adminNotes?: string;
    };

    const booking = await PackageBooking.findById(id).populate('packageId');
    if (!booking) {
      throw new AppError('Package booking not found', 404);
    }

    if (booking.status !== 'pending_date') {
      throw new AppError('Travel dates can only be assigned when booking status is pending_date', 400);
    }

    if (!startDate || !endDate) {
      throw new AppError('startDate and endDate are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError('Invalid dates', 400);
    }
    if (end < start) {
      throw new AppError('End date must be on or after start date', 400);
    }

    booking.travelDates = { startDate: start, endDate: end };
    if (adminNotes !== undefined) {
      booking.adminNotes = adminNotes;
    }
    booking.status = 'confirmed';

    await booking.save();

    const populated = await PackageBooking.findById(booking._id).populate('packageId').populate('userId', 'firstName lastName email');

    successResponse(res, 'Travel dates assigned successfully', populated);
  } catch (error) {
    next(error);
  }
};
