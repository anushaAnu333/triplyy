import { Router } from 'express';
import {
  getDashboardStats,
  getRecentBookings,
  getRevenueAnalytics,
  getPopularDestinations,
  getUserGrowth,
  getPendingActivities,
  getAllActivities,
  approveActivity,
  rejectActivity,
} from '../controllers/adminController';
import {
  createInvitation,
  getAllInvitations,
  resendInvitation,
  cancelInvitation,
} from '../controllers/invitationController';
import {
  getAllAffiliates,
  getAllCommissions,
  approveCommission,
  markCommissionAsPaid,
  updateCommissionStatus,
  getAllWithdrawals,
  processWithdrawal,
  rejectWithdrawal,
} from '../controllers/affiliateController';
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

// Affiliate routes
router.get('/affiliates', (req, res, next) =>
  getAllAffiliates(req as AuthRequest, res, next)
);

// Commission routes
router.get('/commissions/:status?', (req, res, next) =>
  getAllCommissions(req as AuthRequest, res, next)
);

router.put('/commissions/:id/approve', (req, res, next) =>
  approveCommission(req as AuthRequest, res, next)
);

router.put('/commissions/:id/pay', (req, res, next) =>
  markCommissionAsPaid(req as AuthRequest, res, next)
);

router.put('/commissions/:id/status', (req, res, next) =>
  updateCommissionStatus(req as AuthRequest, res, next)
);

// Withdrawal routes
router.get('/withdrawals', (req, res, next) =>
  getAllWithdrawals(req as AuthRequest, res, next)
);

router.put('/withdrawals/:id/process', (req, res, next) =>
  processWithdrawal(req as AuthRequest, res, next)
);

router.put('/withdrawals/:id/reject', (req, res, next) =>
  rejectWithdrawal(req as AuthRequest, res, next)
);

// Invitation routes
router.post('/invitations', (req, res, next) =>
  createInvitation(req as AuthRequest, res, next)
);

router.get('/invitations', (req, res, next) =>
  getAllInvitations(req as AuthRequest, res, next)
);

router.post('/invitations/:id/resend', (req, res, next) =>
  resendInvitation(req as AuthRequest, res, next)
);

router.delete('/invitations/:id', (req, res, next) =>
  cancelInvitation(req as AuthRequest, res, next)
);

// Activity management routes
router.get('/activities/pending', (req, res, next) =>
  getPendingActivities(req as AuthRequest, res, next)
);

router.get('/activities/all', (req, res, next) =>
  getAllActivities(req as AuthRequest, res, next)
);

router.put('/activities/:id/approve', (req, res, next) =>
  approveActivity(req as AuthRequest, res, next)
);

router.put('/activities/:id/reject', (req, res, next) =>
  rejectActivity(req as AuthRequest, res, next)
);

export default router;

