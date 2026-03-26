import { Router } from 'express';
import { 
  getActivities, 
  getActivityById, 
  submitInquiry,
  getActivityAvailability,
  createActivityBooking,
  getActivityBookingById,
  getAdminActivityBookingDetail,
  getMyActivityBookings,
  confirmActivityBooking,
  markMerchantPayoutPaidAdmin,
  getAdminActivityBookings,
  cancelActivityBooking,
} from '../controllers/activityController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes - no authentication required

// Get all approved activities
router.get('/', getActivities);

// Admin: get all activity bookings
// NOTE: must be before /bookings/:bookingId
router.get(
  '/bookings/admin',
  authenticate as any,
  (req, res, next) => getAdminActivityBookings(req as AuthRequest, res, next)
);

// Admin: get full booking detail (trip + merchant + payout account context)
router.get(
  '/bookings/admin/:bookingId',
  authenticate as any,
  (req, res, next) => getAdminActivityBookingDetail(req as AuthRequest, res, next)
);

// Get activity booking by ID (requires authentication) - must be before /:id route
router.get(
  '/bookings/:bookingId',
  authenticate as any,
  (req, res, next) => getActivityBookingById(req as AuthRequest, res, next)
);

// Get my activity bookings
router.get(
  '/my-bookings',
  authenticate as any,
  (req, res, next) => getMyActivityBookings(req as AuthRequest, res, next)
);

// Confirm/Approve activity booking (payment_completed -> confirmed)
router.put(
  '/bookings/:bookingId/confirm',
  authenticate as any,
  (req, res, next) => confirmActivityBooking(req as AuthRequest, res, next)
);

// Admin: record manual merchant payout (80%) after trip completed
router.put(
  '/bookings/:bookingId/mark-merchant-payout-paid',
  authenticate as any,
  (req, res, next) => markMerchantPayoutPaidAdmin(req as AuthRequest, res, next)
);

// Cancel activity booking (only pending_payment)
router.put(
  '/bookings/:bookingId/cancel',
  authenticate as any,
  (req, res, next) => cancelActivityBooking(req as AuthRequest, res, next)
);

// Get activity by ID
router.get('/:id', getActivityById);

// Get availability calendar for an activity
router.get('/:id/availability', getActivityAvailability);

// Submit inquiry/booking (old method - kept for backward compatibility)
router.post('/:id/inquire', submitInquiry);

// Create activity booking (new method with payment)
router.post(
  '/:id/book',
  authenticate as any,
  (req, res, next) => createActivityBooking(req as AuthRequest, res, next)
);

export default router;
