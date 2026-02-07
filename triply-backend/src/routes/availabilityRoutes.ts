import { Router } from 'express';
import {
  getAvailability,
  createAvailability,
  blockDate,
  unblockDate,
  bulkUpdateAvailability,
  bulkUpdateSlots,
  bulkBlockDates,
} from '../controllers/availabilityController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.get('/destination/:destinationId', getAvailability);

// Admin routes - specific routes first to avoid conflicts
router.post(
  '/',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => createAvailability(req as AuthRequest, res, next)
);

router.post(
  '/bulk-update',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => bulkUpdateAvailability(req as AuthRequest, res, next)
);

// Bulk operations by destination ID (for admin calendar UI) - must come before /:id routes
router.put(
  '/:destinationId/bulk',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => bulkUpdateSlots(req as AuthRequest, res, next)
);

router.put(
  '/:destinationId/block',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => bulkBlockDates(req as AuthRequest, res, next)
);

// Get availability by destination ID (alternative route for admin) - must come before /:id routes
router.get(
  '/:destinationId',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => {
    return getAvailability(req as any, res, next);
  }
);

// Single availability record operations (must come after destination routes)
router.put(
  '/:id/block',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => blockDate(req as AuthRequest, res, next)
);

router.put(
  '/:id/unblock',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => unblockDate(req as AuthRequest, res, next)
);

export default router;

