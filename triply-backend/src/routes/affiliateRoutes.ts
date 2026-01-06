import { Router } from 'express';
import {
  registerAsAffiliate,
  getAffiliateDashboard,
  getMyCodes,
  generateCode,
  validateCode,
  getAffiliateBookings,
  getCommissions,
  getAllAffiliates,
  updateCommissionRate,
  toggleAffiliateStatus,
  enableReferralSharing,
  exportAffiliateReport,
} from '../controllers/affiliateController';
import { authenticate } from '../middleware/auth';
import { adminOnly, affiliateOnly, adminOrAffiliate } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.get('/validate/:code', validateCode);

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
  '/commissions',
  authenticate as any,
  affiliateOnly as any,
  (req, res, next) => getCommissions(req as AuthRequest, res, next)
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

