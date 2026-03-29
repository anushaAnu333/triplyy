import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  User,
  AffiliateCode,
  Commission,
  Booking,
  Withdrawal,
  ReferralPartnerOnboarding,
} from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, PaginationQuery } from '../types/custom';
import { generateAffiliateCode } from '../utils/generateReference';
import { generateAffiliateReport, convertToCSV } from '../services/reportService';

/**
 * Register as affiliate (legacy — disabled: use referral partner onboarding + admin approval)
 * POST /api/v1/affiliates/register
 */
export const registerAsAffiliate = async (
  _req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    throw new AppError(
      'Referral partner signup is completed through onboarding. Submit your application from the Referral Partner page and wait for admin approval.',
      400
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate dashboard data
 * GET /api/v1/affiliates/dashboard
 */
export const getAffiliateDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const affiliateObjectId = new mongoose.Types.ObjectId(userId);

    // Get affiliate codes
    const codes = await AffiliateCode.find({ affiliateId: userId });

    // Signups per referral code (source of truth — matches User.referredBy + referralCode)
    const signupRows = await User.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          referredBy: affiliateObjectId,
          referralCode: { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: { $toUpper: '$referralCode' },
          count: { $sum: 1 },
        },
      },
    ]);
    const signupsByCode = new Map(signupRows.map((r) => [r._id, r.count]));

    const totalReferredUsers = await User.countDocuments({ referredBy: affiliateObjectId });

    // Get commission stats
    const commissionStats = await Commission.aggregate([
      { $match: { affiliateId: userId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent trips from referred users (same source as GET /affiliates/referral-bookings)
    const referredUserIds = await User.distinct('_id', { referredBy: affiliateObjectId });
    let recentBookings: Array<Record<string, unknown>> = [];
    if (referredUserIds.length > 0) {
      const recentRaw = await Booking.find({ userId: { $in: referredUserIds } })
        .populate('destinationId', 'name')
        .populate('userId', 'firstName lastName email referralCode')
        .select('bookingReference status depositPayment createdAt numberOfTravellers userId')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentIds = recentRaw.map((b) => b._id);
      const recentCommissions =
        recentIds.length > 0
          ? await Commission.find({
              affiliateId: affiliateObjectId,
              bookingId: { $in: recentIds },
            }).lean()
          : [];
      const recentCommissionByBooking = new Map(
        recentCommissions.map((c) => [String(c.bookingId), c])
      );

      recentBookings = recentRaw.map((b) => {
        const row = b.toObject();
        const c = recentCommissionByBooking.get(String(b._id));
        return {
          ...row,
          referralCommission: c
            ? {
                commissionAmount: c.commissionAmount,
                commissionRate: c.commissionRate,
                status: c.status,
                commissionBasisAmount: c.bookingAmount,
                affiliateCode: c.affiliateCode,
              }
            : null,
        };
      });
    }

    // Calculate totals
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let approvedEarnings = 0;
    let paidEarnings = 0;
    let commissionRecordCount = 0;

    commissionStats.forEach((stat) => {
      commissionRecordCount += stat.count;
      totalEarnings += stat.total;
      if (stat._id === 'pending') {
        pendingEarnings += stat.total;
      } else if (stat._id === 'approved') {
        approvedEarnings += stat.total;
      } else if (stat._id === 'paid') {
        paidEarnings += stat.total;
      }
    });

    successResponse(res, 'Dashboard data retrieved', {
      stats: {
        /** @deprecated Prefer totalReferredUsers for "people referred" — this is commission row count */
        totalBookings: commissionRecordCount,
        totalReferredUsers,
        totalEarnings,
        pendingEarnings,
        approvedEarnings,
        paidEarnings,
      },
      codes: codes.map((c) => {
        const codeUpper = c.code.toUpperCase();
        const signupCount = signupsByCode.get(codeUpper) ?? 0;
        return {
          code: c.code,
          commissionRate: c.commissionRate,
          /** Bookings that stored this code on the booking (link/checkout flow) */
          usageCount: c.usageCount,
          /** Accounts registered with this code (refer-a-friend signup flow) */
          signupCount,
          totalEarnings: c.totalEarnings,
          isActive: c.isActive,
        };
      }),
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate's codes
 * GET /api/v1/affiliates/my-codes
 */
export const getMyCodes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    const codes = await AffiliateCode.find({ affiliateId: userId }).sort({ createdAt: -1 });

    successResponse(res, 'Affiliate codes retrieved', codes);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate new affiliate code
 * POST /api/v1/affiliates/generate-code
 */
export const generateCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { prefix } = req.body;

    // Check how many codes user already has (limit to 5)
    const existingCodes = await AffiliateCode.countDocuments({ affiliateId: userId });
    if (existingCodes >= 5) {
      throw new AppError('Maximum number of affiliate codes reached (5)', 400);
    }

    const code = generateAffiliateCode(prefix);
    const affiliateCode = await AffiliateCode.create({
      affiliateId: userId,
      code,
      commissionRate: 10,
      commissionType: 'percentage',
      canShareReferral: true, // Allow affiliates to share referral codes
      discountPercentage: 10, // Default 10% discount for referred users
    });

    createdResponse(res, 'Affiliate code generated', {
      code: affiliateCode.code,
      commissionRate: affiliateCode.commissionRate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate affiliate code
 * GET /api/v1/affiliates/validate/:code
 */
export const validateCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;

    const affiliateCode = await AffiliateCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).populate('affiliateId', 'firstName');

    if (!affiliateCode) {
      throw new AppError('Invalid or inactive affiliate code', 404);
    }

    const affiliate = affiliateCode.affiliateId as unknown as { firstName: string };

    // Check if code can be used for referrals (signup)
    const canUseForReferral = affiliateCode.canShareReferral || false;
    
    // Calculate discount if applicable
    let discountAmount = 0;
    if (canUseForReferral) {
      if (affiliateCode.discountPercentage) {
        discountAmount = (199 * affiliateCode.discountPercentage) / 100; // Percentage of AED 199
      } else if (affiliateCode.discountAmount) {
        discountAmount = affiliateCode.discountAmount;
      }
    }

    successResponse(res, 'Valid code', {
      code: affiliateCode.code,
      affiliateName: affiliate.firstName,
      isValid: true,
      canUseForReferral,
      discountAmount: canUseForReferral ? discountAmount : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings using affiliate code
 * GET /api/v1/affiliates/bookings
 */
export const getAffiliateBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10' } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find({ affiliateId: userId })
        .populate('destinationId', 'name thumbnailImage')
        .select('bookingReference status depositPayment createdAt affiliateCode userId')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments({ affiliateId: userId }),
    ]);

    const bIds = bookings.map((b) => b._id);
    const comms =
      bIds.length > 0
        ? await Commission.find({
            affiliateId: new mongoose.Types.ObjectId(userId),
            bookingId: { $in: bIds },
          }).lean()
        : [];
    const commByBooking = new Map(comms.map((c) => [String(c.bookingId), c]));

    const enriched = bookings.map((b) => {
      const row = b.toObject();
      const c = commByBooking.get(String(b._id));
      return {
        ...row,
        bookingCommission: c
          ? {
              commissionAmount: c.commissionAmount,
              commissionRate: c.commissionRate,
              status: c.status,
              commissionBasisAmount: c.bookingAmount,
              affiliateCode: c.affiliateCode,
            }
          : null,
      };
    });

    successResponse(
      res,
      'Affiliate bookings retrieved',
      enriched,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings made by referred users
 * GET /api/v1/affiliates/referral-bookings
 */
export const getReferralBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10' } = req.query as PaginationQuery;
    const status = (req.query as Record<string, string>).status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    // Find all users who were referred by this affiliate
    const referredUsers = await User.find({ 
      referredBy: new mongoose.Types.ObjectId(userId) 
    }).select('_id');

    const referredUserIds = referredUsers.map(user => user._id);

    if (referredUserIds.length === 0) {
      successResponse(
        res,
        'Referral bookings retrieved',
        [],
        getPaginationMeta(pageNum, limitNum, 0)
      );
      return;
    }

    // Build query
    const query: Record<string, unknown> = {
      userId: { $in: referredUserIds },
    };

    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('destinationId', 'name thumbnailImage')
        .populate('userId', 'firstName lastName email referralCode')
        .select(
          'bookingReference status depositPayment createdAt updatedAt numberOfTravellers userId travelDates specialRequests rejectionReason affiliateCode adminNotes calendarUnlockedUntil'
        )
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ]);

    const bookingIds = bookings.map((b) => b._id);
    const commissionsForBookings =
      bookingIds.length > 0
        ? await Commission.find({
            affiliateId: new mongoose.Types.ObjectId(userId),
            bookingId: { $in: bookingIds },
          }).lean()
        : [];

    const commissionByBookingId = new Map(
      commissionsForBookings.map((c) => [String(c.bookingId), c])
    );

    const enriched = bookings.map((b) => {
      const row = b.toObject();
      const c = commissionByBookingId.get(String(b._id));
      return {
        ...row,
        referralCommission: c
          ? {
              commissionAmount: c.commissionAmount,
              commissionRate: c.commissionRate,
              status: c.status,
              /** Amount the commission was calculated from (e.g. deposit paid + referral discount) */
              commissionBasisAmount: c.bookingAmount,
              affiliateCode: c.affiliateCode,
            }
          : null,
      };
    });

    successResponse(
      res,
      'Referral bookings retrieved',
      enriched,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get commission history
 * GET /api/v1/affiliates/commissions
 */
export const getCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { affiliateId: userId };
    if (status) {
      query.status = status;
    }

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('bookingId', 'bookingReference')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Commission.countDocuments(query),
    ]);

    successResponse(
      res,
      'Commission history retrieved',
      commissions,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

// ==================== Admin Routes ====================

/**
 * Get all commissions (Admin)
 * GET /api/v1/admin/commissions/:status?
 */
export const getAllCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.params;
    const { page = '1', limit = '10' } = req.query as PaginationQuery;
    const affiliateId = (req.query as Record<string, string>).affiliateId;
    const statusQuery = (req.query as Record<string, string>).status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, unknown> = {};
    
    // Use status from params or query
    const statusFilter = status || statusQuery;
    if (statusFilter) {
      query.status = statusFilter;
    }
    
    if (affiliateId) {
      query.affiliateId = new mongoose.Types.ObjectId(affiliateId);
    }

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('affiliateId', 'firstName lastName email')
        .populate('bookingId', 'bookingReference depositPayment')
        .populate({
          path: 'metadata.referredUserId',
          select: 'firstName lastName email',
          model: 'User',
        })
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Commission.countDocuments(query),
    ]);

    successResponse(
      res,
      'Commissions retrieved',
      commissions,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve commission (Admin)
 * PUT /api/v1/admin/commissions/:id/approve
 */
export const approveCommission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const commission = await Commission.findById(id);

    if (!commission) {
      throw new AppError('Commission not found', 404);
    }

    if (commission.status !== 'pending') {
      throw new AppError(`Commission is already ${commission.status}`, 400);
    }

    commission.status = 'approved';
    await commission.save();

    successResponse(res, 'Commission approved successfully', commission);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark commission as paid (Admin)
 * PUT /api/v1/admin/commissions/:id/pay
 */
export const markCommissionAsPaid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentReference } = req.body;

    const commission = await Commission.findById(id);

    if (!commission) {
      throw new AppError('Commission not found', 404);
    }

    if (commission.status === 'paid') {
      throw new AppError('Commission is already marked as paid', 400);
    }

    commission.status = 'paid';
    commission.paidAt = new Date();
    if (paymentReference) {
      commission.paymentReference = paymentReference;
    }
    await commission.save();

    successResponse(res, 'Commission marked as paid successfully', commission);
  } catch (error) {
    next(error);
  }
};

/**
 * Update commission status (Admin)
 * PUT /api/v1/admin/commissions/:id/status
 */
export const updateCommissionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentReference } = req.body;

    if (!['pending', 'approved', 'paid'].includes(status)) {
      throw new AppError('Invalid commission status', 400);
    }

    const commission = await Commission.findById(id);

    if (!commission) {
      throw new AppError('Commission not found', 404);
    }

    commission.status = status;
    if (status === 'paid') {
      commission.paidAt = new Date();
      if (paymentReference) {
        commission.paymentReference = paymentReference;
      }
    }
    await commission.save();

    successResponse(res, 'Commission status updated successfully', commission);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all affiliates (Admin)
 * GET /api/v1/admin/affiliates
 */
export const getAllAffiliates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const [affiliates, total, totalPaidAgg] = await Promise.all([
      User.find({ role: 'affiliate' })
        .select('firstName lastName email createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      User.countDocuments({ role: 'affiliate' }),
      Commission.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
    ]);

    const affiliateIds = affiliates.map((a) => a._id);
    const commissionByAffiliate = new Map<
      string,
      { pending: number; approved: number; paid: number }
    >();

    if (affiliateIds.length > 0) {
      const rows = await Commission.aggregate<{
        _id: { affiliateId: mongoose.Types.ObjectId; status: string };
        total: number;
      }>([
        {
          $match: {
            affiliateId: { $in: affiliateIds },
          },
        },
        {
          $group: {
            _id: { affiliateId: '$affiliateId', status: '$status' },
            total: { $sum: '$commissionAmount' },
          },
        },
      ]);

      for (const row of rows) {
        const aid = String(row._id.affiliateId);
        const cur = commissionByAffiliate.get(aid) ?? {
          pending: 0,
          approved: 0,
          paid: 0,
        };
        const st = row._id.status as 'pending' | 'approved' | 'paid';
        if (st === 'pending') cur.pending = row.total;
        else if (st === 'approved') cur.approved = row.total;
        else if (st === 'paid') cur.paid = row.total;
        commissionByAffiliate.set(aid, cur);
      }
    }

    const totalPaidOut = totalPaidAgg[0]?.total ?? 0;

    const [allCodes, referralSignupCounts] = await Promise.all([
      AffiliateCode.find({ affiliateId: { $in: affiliateIds } })
        .sort({ createdAt: -1 })
        .lean(),
      affiliateIds.length > 0
        ? User.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: { referredBy: { $in: affiliateIds } } },
            { $group: { _id: '$referredBy', count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
    ]);

    const codesByAffiliateId = new Map<string, (typeof allCodes)[number][]>();
    for (const c of allCodes) {
      const aid = String(c.affiliateId);
      const list = codesByAffiliateId.get(aid);
      if (list) list.push(c);
      else codesByAffiliateId.set(aid, [c]);
    }
    for (const arr of codesByAffiliateId.values()) {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime()
      );
    }

    const referralCountByAffiliate = new Map(
      referralSignupCounts.map((r) => [String(r._id), r.count])
    );

    const affiliatesWithCodes = affiliates.map((affiliate) => {
      const aid = String(affiliate._id);
      const codes = codesByAffiliateId.get(aid) ?? [];
      const totalEarnings = codes.reduce((sum, c) => sum + c.totalEarnings, 0);
      const totalUsage = codes.reduce((sum, c) => sum + c.usageCount, 0);
      /** Matches dashboard: users with referredBy = this affiliate */
      const totalReferrals = referralCountByAffiliate.get(aid) ?? 0;

      const comm = commissionByAffiliate.get(aid) ?? {
        pending: 0,
        approved: 0,
        paid: 0,
      };
      const unpaidCommission = comm.pending + comm.approved;

      return {
        ...affiliate.toObject(),
        codes: codes.map((c) => c.code),
        affiliateCodes: codes.map((c) => ({
          _id: c._id,
          code: c.code,
          isActive: c.isActive,
          usageCount: c.usageCount,
        })),
        totalEarnings,
        totalUsage,
        totalReferrals,
        /** Sum of commission rows not yet paid (pending + approved). */
        unpaidCommission,
        /** Approved and ready to mark paid / bank transfer. */
        approvedCommission: comm.approved,
        /** Already paid out (commissions with status paid). */
        paidCommission: comm.paid,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Affiliates retrieved',
      data: affiliatesWithCodes,
      meta: getPaginationMeta(pageNum, limitNum, total),
      totalPaidOut,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: account + latest referral partner onboarding (bank / business for payouts)
 * GET /api/v1/admin/affiliates/:id/details
 */
export const getAffiliateAdminDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid affiliate id', 400);
    }

    const affiliate = await User.findById(id).select(
      'firstName lastName email phoneNumber role isEmailVerified referralPartnerTermsAcceptedAt referralPartnerTermsVersion createdAt updatedAt'
    );

    if (!affiliate || affiliate.role !== 'affiliate') {
      throw new AppError('Affiliate not found', 404);
    }

    const onboarding = await ReferralPartnerOnboarding.findOne({ userId: id })
      .sort({ updatedAt: -1 })
      .lean();

    const referralPartnerOnboarding = onboarding
      ? {
          _id: onboarding._id,
          status: onboarding.status,
          businessType: onboarding.businessType,
          categories: onboarding.categories,
          businessInfo: onboarding.businessInfo || {},
          documentPaths: onboarding.documentPaths || {},
          rejectionReason: onboarding.rejectionReason,
          createdAt: onboarding.createdAt,
          updatedAt: onboarding.updatedAt,
        }
      : null;

    successResponse(res, 'Affiliate details retrieved', {
      user: affiliate.toObject(),
      referralPartnerOnboarding,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all approved commissions for an affiliate as paid (Admin)
 * POST /api/v1/admin/affiliates/:affiliateId/pay-commissions
 */
export const payAffiliateApprovedCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { affiliateId } = req.params;
    const { paymentReference } = req.body as { paymentReference?: string };

    if (!mongoose.Types.ObjectId.isValid(affiliateId)) {
      throw new AppError('Invalid affiliate id', 400);
    }

    const affiliate = await User.findById(affiliateId);
    if (!affiliate || affiliate.role !== 'affiliate') {
      throw new AppError('Affiliate not found', 404);
    }

    const aid = new mongoose.Types.ObjectId(affiliateId);
    const toMark = await Commission.find({
      affiliateId: aid,
      status: 'approved',
    })
      .select('_id commissionAmount')
      .lean();

    if (toMark.length === 0) {
      throw new AppError('No approved commissions to pay out', 400);
    }

    const totalAmount = toMark.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAt = new Date();
    const ids = toMark.map((c) => c._id);

    const setDoc: Record<string, unknown> = {
      status: 'paid',
      paidAt,
    };
    if (paymentReference) {
      setDoc.paymentReference = paymentReference;
    }

    await Commission.updateMany({ _id: { $in: ids } }, { $set: setDoc });

    successResponse(res, 'Commissions marked as paid', {
      count: toMark.length,
      totalAmount,
      commissionIds: ids,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update commission rate (Admin)
 * PUT /api/v1/affiliates/admin/:id/commission-rate
 */
export const updateCommissionRate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      commissionRate, 
      commissionType, 
      fixedAmount,
      canShareReferral,
      discountPercentage,
      discountAmount,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (commissionType) updateData.commissionType = commissionType;
    if (fixedAmount !== undefined) updateData.fixedAmount = fixedAmount;
    if (canShareReferral !== undefined) updateData.canShareReferral = canShareReferral;
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;

    const affiliateCode = await AffiliateCode.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!affiliateCode) {
      throw new AppError('Affiliate code not found', 404);
    }

    successResponse(res, 'Commission rate updated', affiliateCode);
  } catch (error) {
    next(error);
  }
};

/**
 * Activate/Deactivate affiliate code (Admin)
 * PUT /api/v1/affiliates/admin/:id/activate
 */
export const toggleAffiliateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const affiliateCode = await AffiliateCode.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!affiliateCode) {
      throw new AppError('Affiliate code not found', 404);
    }

    successResponse(
      res,
      `Affiliate code ${isActive ? 'activated' : 'deactivated'}`,
      affiliateCode
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Enable/disable referral sharing for affiliate code (Admin)
 * PUT /api/v1/affiliates/admin/:id/enable-referral
 */
export const enableReferralSharing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { canShareReferral, discountPercentage, discountAmount } = req.body;

    const updateData: Record<string, unknown> = {};
    if (canShareReferral !== undefined) updateData.canShareReferral = canShareReferral;
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;

    const affiliateCode = await AffiliateCode.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!affiliateCode) {
      throw new AppError('Affiliate code not found', 404);
    }

    successResponse(
      res,
      `Referral sharing ${canShareReferral ? 'enabled' : 'disabled'}`,
      affiliateCode
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export affiliate report (Admin)
 * GET /api/v1/affiliates/admin/export
 */
export const exportAffiliateReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, affiliateId, status, format = 'csv' } = req.query;

    const reportData = await generateAffiliateReport({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      affiliateId: affiliateId as string,
      status: status as string,
    });

    if (format === 'csv') {
      const headers = [
        'affiliateName',
        'affiliateEmail',
        'code',
        'bookingReference',
        'bookingAmount',
        'commissionAmount',
        'commissionStatus',
        'createdAt',
      ];

      const csv = convertToCSV(reportData as unknown as Record<string, unknown>[], headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=affiliate-report.csv');
      res.send(csv);
    } else {
      successResponse(res, 'Affiliate report generated', reportData);
    }
  } catch (error) {
    next(error);
  }
};

// ==================== User Referral Routes ====================

/**
 * Get user's referral code and stats (for regular users)
 * GET /api/v1/affiliates/my-referral
 */
export const getMyReferral = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    // Find user's referral code (the one they can share)
    const referralCode = await AffiliateCode.findOne({
      affiliateId: new mongoose.Types.ObjectId(userId),
      canShareReferral: true,
      isActive: true,
    });

    if (!referralCode) {
      // If no referral code exists, create one
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const newCode = generateAffiliateCode(user.firstName.substring(0, 3));
      const createdCode = await AffiliateCode.create({
        affiliateId: userId,
        code: newCode,
        commissionRate: 10,
        commissionType: 'percentage',
        canShareReferral: true,
        discountPercentage: 10,
        isActive: true,
      });

      // Get stats
      const referredUsers = await User.countDocuments({ referredBy: new mongoose.Types.ObjectId(userId) });
      const referralCommissions = await Commission.aggregate([
        {
          $match: {
            affiliateId: new mongoose.Types.ObjectId(userId),
            'metadata.type': 'referral',
          },
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$commissionAmount' },
            count: { $sum: 1 },
          },
        },
      ]);

      let totalEarnings = 0;
      let pendingEarnings = 0;
      let paidEarnings = 0;

      referralCommissions.forEach((stat) => {
        totalEarnings += stat.total;
        if (stat._id === 'pending' || stat._id === 'approved') {
          pendingEarnings += stat.total;
        } else if (stat._id === 'paid') {
          paidEarnings += stat.total;
        }
      });

      successResponse(res, 'Referral code retrieved', {
        code: createdCode.code,
        discountPercentage: createdCode.discountPercentage || 10,
        stats: {
          totalReferrals: referredUsers,
          totalEarnings,
          pendingEarnings,
          paidEarnings,
        },
      });
      return;
    }

    // Get stats
    const referredUsers = await User.countDocuments({ referredBy: new mongoose.Types.ObjectId(userId) });
    const referralCommissions = await Commission.aggregate([
      {
        $match: {
          affiliateId: new mongoose.Types.ObjectId(userId),
          'metadata.type': 'referral',
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;

    referralCommissions.forEach((stat) => {
      totalEarnings += stat.total;
      if (stat._id === 'pending' || stat._id === 'approved') {
        pendingEarnings += stat.total;
      } else if (stat._id === 'paid') {
        paidEarnings += stat.total;
      }
    });

    successResponse(res, 'Referral code retrieved', {
      code: referralCode.code,
      discountPercentage: referralCode.discountPercentage || 10,
      stats: {
        totalReferrals: referredUsers,
        totalEarnings,
        pendingEarnings,
        paidEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of users referred by current user
 * GET /api/v1/affiliates/my-referrals
 */
export const getMyReferrals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10' } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const [referredUsers, total] = await Promise.all([
      User.find({ referredBy: new mongoose.Types.ObjectId(userId) })
        .select('firstName lastName email referralCode createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      User.countDocuments({ referredBy: new mongoose.Types.ObjectId(userId) }),
    ]);

    // Get commission info for each referred user
    const referralsWithEarnings = await Promise.all(
      referredUsers.map(async (user) => {
        const commissions = await Commission.find({
          affiliateId: userId,
          'metadata.referredUserId': user._id.toString(),
        });

        const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const hasBooking = commissions.length > 0;

        return {
          ...user.toObject(),
          hasBooking,
          totalEarnings,
          commissionCount: commissions.length,
        };
      })
    );

    successResponse(
      res,
      'Referred users retrieved',
      referralsWithEarnings,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral commission history for current user
 * GET /api/v1/affiliates/my-referral-commissions
 */
export const getMyReferralCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {
      affiliateId: new mongoose.Types.ObjectId(userId),
      'metadata.type': 'referral',
    };
    if (status) {
      query.status = status;
    }

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('bookingId', 'bookingReference')
        .populate({
          path: 'metadata.referredUserId',
          select: 'firstName lastName email',
          model: 'User',
        })
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Commission.countDocuments(query),
    ]);

    successResponse(
      res,
      'Referral commissions retrieved',
      commissions,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};


export const requestWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { 
      amount, 
      currency = 'AED',
      paymentMethod,
      paymentDetails,
      commissionIds 
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new AppError('Invalid withdrawal amount', 400);
    }

    // Validate payment method
    if (!paymentMethod || !['bank_transfer', 'paypal', 'stripe', 'other'].includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    // Get approved commissions for this affiliate
    const approvedCommissions = await Commission.find({
      affiliateId: userId,
      status: 'approved',
      _id: commissionIds ? { $in: commissionIds } : undefined,
    });

    if (approvedCommissions.length === 0) {
      throw new AppError('No approved commissions available for withdrawal', 400);
    }

    // Calculate total available amount
    const totalAvailable = approvedCommissions.reduce(
      (sum, commission) => sum + commission.commissionAmount,
      0
    );

    if (amount > totalAvailable) {
      throw new AppError(
        `Withdrawal amount (${amount}) exceeds available balance (${totalAvailable})`,
        400
      );
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      affiliateId: userId,
      amount,
      currency,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      commissionIds: approvedCommissions.map(c => c._id),
      status: 'pending',
    });

    createdResponse(res, 'Withdrawal request submitted successfully', withdrawal);
  } catch (error) {
    next(error);
  }
};

/**
 * Get my withdrawals (Affiliate)
 * GET /api/v1/affiliates/withdrawals
 */
export const getMyWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '10', status } = req.query as PaginationQuery & { status?: string };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { affiliateId: userId };
    if (status) {
      query.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('processedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Withdrawal.countDocuments(query),
    ]);

    successResponse(
      res,
      'Withdrawals retrieved',
      withdrawals,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all withdrawals (Admin)
 * GET /api/v1/admin/withdrawals
 */
export const getAllWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', status, affiliateId } = req.query as PaginationQuery & { 
      status?: string;
      affiliateId?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }
    if (affiliateId) {
      query.affiliateId = new mongoose.Types.ObjectId(affiliateId);
    }

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('affiliateId', 'firstName lastName email')
        .populate('processedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Withdrawal.countDocuments(query),
    ]);

    successResponse(
      res,
      'Withdrawals retrieved',
      withdrawals,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Process withdrawal (Admin)
 * PUT /api/v1/admin/withdrawals/:id/process
 */
export const processWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentReference, adminNotes } = req.body;
    const adminId = req.user.userId;

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'pending') {
      throw new AppError(`Withdrawal is already ${withdrawal.status}`, 400);
    }

    // Update withdrawal status
    withdrawal.status = 'processing';
    withdrawal.processedBy = new mongoose.Types.ObjectId(adminId);
    if (adminNotes) {
      withdrawal.adminNotes = adminNotes;
    }
    await withdrawal.save();

    // Mark commissions as paid
    await Commission.updateMany(
      { _id: { $in: withdrawal.commissionIds } },
      { 
        status: 'paid',
        paidAt: new Date(),
        paymentReference: paymentReference || `WITHDRAWAL-${withdrawal._id}`,
      }
    );

    // Mark withdrawal as completed
    withdrawal.status = 'completed';
    withdrawal.processedAt = new Date();
    if (paymentReference) {
      withdrawal.paymentReference = paymentReference;
    }
    await withdrawal.save();

    successResponse(res, 'Withdrawal processed successfully', withdrawal);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject withdrawal (Admin)
 * PUT /api/v1/admin/withdrawals/:id/reject
 */
export const rejectWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.userId;

    if (!rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'pending') {
      throw new AppError(`Cannot reject withdrawal with status: ${withdrawal.status}`, 400);
    }

    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = rejectionReason;
    withdrawal.processedBy = new mongoose.Types.ObjectId(adminId);
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    successResponse(res, 'Withdrawal rejected successfully', withdrawal);
  } catch (error) {
    next(error);
  }
};
