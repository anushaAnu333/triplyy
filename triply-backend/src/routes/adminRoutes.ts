import { Router } from 'express';
import {
  getDashboardStats,
  getRecentBookings,
  getRevenueAnalytics,
  getPopularDestinations,
  getUserGrowth,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// All routes require admin authentication
router.use(authenticate as any, adminOnly as any);

router.get('/stats', (req, res, next) =>
  getDashboardStats(req as AuthRequest, res, next)
);

router.get('/recent-bookings', (req, res, next) =>
  getRecentBookings(req as AuthRequest, res, next)
);

router.get('/revenue', (req, res, next) =>
  getRevenueAnalytics(req as AuthRequest, res, next)
);

router.get('/popular-destinations', (req, res, next) =>
  getPopularDestinations(req as AuthRequest, res, next)
);

router.get('/user-growth', (req, res, next) =>
  getUserGrowth(req as AuthRequest, res, next)
);

export default router;

