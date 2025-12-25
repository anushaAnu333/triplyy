import { Router } from 'express';
import {
  getAvailability,
  createAvailability,
  blockDate,
  unblockDate,
  bulkUpdateAvailability,
} from '../controllers/availabilityController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.get('/destination/:destinationId', getAvailability);

// Admin routes
router.post(
  '/',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => createAvailability(req as AuthRequest, res, next)
);

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

router.post(
  '/bulk-update',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => bulkUpdateAvailability(req as AuthRequest, res, next)
);

export default router;

