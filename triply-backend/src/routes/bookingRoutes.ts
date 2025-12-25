import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  selectDates,
  cancelBooking,
  getAllBookings,
  confirmBooking,
  rejectBooking,
  addAdminNotes,
  exportBookings,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { validate } from '../middleware/validation';
import {
  createBookingValidator,
  selectDatesValidator,
  adminUpdateBookingValidator,
  rejectBookingValidator,
} from '../validators/bookingValidator';
import { AuthRequest } from '../types/custom';

const router = Router();

// User routes (all require authentication)
router.post(
  '/',
  authenticate as any,
  validate(createBookingValidator),
  (req, res, next) => createBooking(req as AuthRequest, res, next)
);

router.get(
  '/my-bookings',
  authenticate as any,
  (req, res, next) => getMyBookings(req as AuthRequest, res, next)
);

router.get(
  '/:id',
  authenticate as any,
  (req, res, next) => getBookingById(req as AuthRequest, res, next)
);

router.put(
  '/:id/select-dates',
  authenticate as any,
  validate(selectDatesValidator),
  (req, res, next) => selectDates(req as AuthRequest, res, next)
);

router.put(
  '/:id/cancel',
  authenticate as any,
  (req, res, next) => cancelBooking(req as AuthRequest, res, next)
);

// Admin routes
router.get(
  '/admin/all',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => getAllBookings(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/confirm',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => confirmBooking(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/reject',
  authenticate as any,
  adminOnly as any,
  validate(rejectBookingValidator),
  (req, res, next) => rejectBooking(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/notes',
  authenticate as any,
  adminOnly as any,
  validate(adminUpdateBookingValidator),
  (req, res, next) => addAdminNotes(req as AuthRequest, res, next)
);

router.get(
  '/admin/export',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => exportBookings(req as AuthRequest, res, next)
);

export default router;

