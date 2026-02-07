import { Router } from 'express';
import { 
  getActivities, 
  getActivityById, 
  submitInquiry,
  getActivityAvailability,
  createActivityBooking,
  getActivityBookingById,
} from '../controllers/activityController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes - no authentication required

// Get all approved activities
router.get('/', getActivities);

// Get activity booking by ID (requires authentication) - must be before /:id route
router.get(
  '/bookings/:bookingId',
  authenticate as any,
  (req, res, next) => getActivityBookingById(req as AuthRequest, res, next)
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
