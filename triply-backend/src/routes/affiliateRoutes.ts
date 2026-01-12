import { Router } from 'express';
import {
  registerAsAffiliate,
  getAffiliateDashboard,
  getMyCodes,
  generateCode,
  validateCode,
  getAffiliateBookings,
  getReferralBookings,
  getCommissions,
  getAllAffiliates,
  updateCommissionRate,
  toggleAffiliateStatus,
  enableReferralSharing,
  exportAffiliateReport,
  getMyReferral,
  getMyReferrals,
  getMyReferralCommissions,
  requestWithdrawal,
  getMyWithdrawals,
} from '../controllers/affiliateController';
import { authenticate } from '../middleware/auth';
import { adminOnly, affiliateOnly, adminOrAffiliate } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.get('/validate/:code', validateCode);

// User referral routes (accessible to all authenticated users)
router.get(
  '/my-referral',
  authenticate as any,
  (req, res, next) => getMyReferral(req as AuthRequest, res, next)
);

router.get(
  '/my-referrals',
  authenticate as any,
  (req, res, next) => getMyReferrals(req as AuthRequest, res, next)
);

router.get(
  '/my-referral-commissions',
  authenticate as any,
  (req, res, next) => getMyReferralCommissions(req as AuthRequest, res, next)
);

// Affiliate routes
router.post(
  '/register',
  authenticate as any,
  (req, res, next) => registerAsAffiliate(req as AuthRequest, res, next)
);

router.get(
  '/dashboard',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getAffiliateDashboard(req as AuthRequest, res, next)
);

router.get(
  '/my-codes',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getMyCodes(req as AuthRequest, res, next)
);

router.post(
  '/generate-code',
  authenticate as any,
  adminOrAffiliate as any,
  (req, res, next) => generateCode(req as AuthRequest, res, next)
);

router.get(
  '/bookings',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getAffiliateBookings(req as AuthRequest, res, next)
);

router.get(
  '/referral-bookings',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getReferralBookings(req as AuthRequest, res, next)
);

router.get(
  '/commissions',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getCommissions(req as AuthRequest, res, next)
);

// Withdrawal routes (Affiliate)
router.post(
  '/withdrawals',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => requestWithdrawal(req as AuthRequest, res, next)
);

router.get(
  '/withdrawals',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getMyWithdrawals(req as AuthRequest, res, next)
);

// Admin routes
router.get(
  '/admin/all',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => getAllAffiliates(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/commission-rate',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => updateCommissionRate(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/activate',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => toggleAffiliateStatus(req as AuthRequest, res, next)
);

router.put(
  '/admin/:id/enable-referral',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => enableReferralSharing(req as AuthRequest, res, next)
);

router.get(
  '/admin/export',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => exportAffiliateReport(req as AuthRequest, res, next)
);

export default router;

