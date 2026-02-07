import { Router } from 'express';
import {
  registerAsMerchant,
  submitActivity,
  getMerchantActivities,
  getMerchantDashboard,
  getMerchantBookings,
  getActivityAvailability,
  blockActivityDates,
  updateActivitySlots,
} from '../controllers/merchantController';
import { authenticate } from '../middleware/auth';
import { uploadActivityImages } from '../utils/upload';
import { AuthRequest } from '../types/custom';

const router = Router();

// Register as merchant (requires authentication but not merchant role)
router.post(
  '/register',
  authenticate as any,
  (req, res, next) => registerAsMerchant(req as AuthRequest, res, next)
);

// All other routes require merchant authentication
router.use(authenticate as any);

// Submit new activity (with file upload)
router.post(
  '/activities',
  (req, res, next) => {
    uploadActivityImages.array('photos', 3)(req, res, (err) => {
      if (err) {
        return next(err);
      }
      submitActivity(req as AuthRequest, res, next);
    });
  }
);

// Get merchant's activities
router.get('/activities', (req, res, next) =>
  getMerchantActivities(req as AuthRequest, res, next)
);

// Get merchant dashboard
router.get('/dashboard', (req, res, next) =>
  getMerchantDashboard(req as AuthRequest, res, next)
);

// Get merchant's bookings
router.get('/bookings', (req, res, next) =>
  getMerchantBookings(req as AuthRequest, res, next)
);

// Get activity availability
router.get('/activities/:activityId/availability', (req, res, next) =>
  getActivityAvailability(req as AuthRequest, res, next)
);

// Block/unblock activity dates
router.put('/activities/:activityId/availability/block', (req, res, next) =>
  blockActivityDates(req as AuthRequest, res, next)
);

// Update activity slots
router.put('/activities/:activityId/availability/slots', (req, res, next) =>
  updateActivitySlots(req as AuthRequest, res, next)
);

export default router;
