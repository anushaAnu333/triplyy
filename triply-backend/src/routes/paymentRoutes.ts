import { Router, raw } from 'express';
import {
  createIntent,
  confirmPayment,
  handleWebhook,
  getPaymentDetails,
  simulatePayment,
  createActivityBookingPaymentIntent,
  confirmActivityBookingPayment,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiter';
import { AuthRequest } from '../types/custom';

const router = Router();

// Webhook route (must use raw body parser)
router.post('/webhook', raw({ type: 'application/json' }), handleWebhook);

// User routes
router.post(
  '/create-intent',
  authenticate as any,
  paymentLimiter,
  (req, res, next) => createIntent(req as AuthRequest, res, next)
);

router.post(
  '/confirm',
  authenticate as any,
  (req, res, next) => confirmPayment(req as AuthRequest, res, next)
);

router.post(
  '/simulate',
  authenticate as any,
  (req, res, next) => simulatePayment(req as AuthRequest, res, next)
);

router.get(
  '/booking/:bookingId',
  authenticate as any,
  (req, res, next) => getPaymentDetails(req as AuthRequest, res, next)
);

// Activity booking payment routes
router.post(
  '/activity-booking/create-intent',
  authenticate as any,
  paymentLimiter,
  (req, res, next) => createActivityBookingPaymentIntent(req as AuthRequest, res, next)
);

router.post(
  '/activity-booking/confirm',
  authenticate as any,
  (req, res, next) => confirmActivityBookingPayment(req as AuthRequest, res, next)
);

export default router;

