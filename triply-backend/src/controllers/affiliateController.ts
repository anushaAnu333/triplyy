import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, AffiliateCode, Commission, Booking, Withdrawal } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, PaginationQuery } from '../types/custom';
import { generateAffiliateCode } from '../utils/generateReference';
import { generateAffiliateReport, convertToCSV } from '../services/reportService';

/**
 * Register as affiliate
 * POST /api/v1/affiliates/register
 */
export const registerAsAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    // Check if user is already an affiliate
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === 'affiliate') {
      throw new AppError('You are already registered as an affiliate', 400);
    }

    if (user.role === 'admin') {
      throw new AppError('Admins cannot register as affiliates', 400);
    }

    // Update user role
    user.role = 'affiliate';
    await user.save();

    // Generate affiliate code
    const code = generateAffiliateCode(user.firstName);
    const affiliateCode = await AffiliateCode.create({
      affiliateId: userId,
      code,
      commissionRate: 10, // Default 10%
      commissionType: 'percentage',
      canShareReferral: true, // Allow affiliates to share referral codes
      discountPercentage: 10, // Default 10% discount for referred users
    });

    createdResponse(res, 'Successfully registered as affiliate', {
      affiliateCode: affiliateCode.code,
      commissionRate: affiliateCode.commissionRate,
    });
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

    // Get affiliate codes
    const codes = await AffiliateCode.find({ affiliateId: userId });

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

    // Get recent bookings
    const recentBookings = await Booking.find({
      affiliateId: userId,
    })
      .populate('destinationId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate totals
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let approvedEarnings = 0;
    let paidEarnings = 0;
    let totalBookings = 0;

    commissionStats.forEach((stat) => {
      totalBookings += stat.count;
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
        totalBookings,
        totalEarnings,
        pendingEarnings,
        approvedEarnings,
        paidEarnings,
      },
      codes: codes.map((c) => ({
        code: c.code,
        commissionRate: c.commissionRate,
        usageCount: c.usageCount,
        totalEarnings: c.totalEarnings,
        isActive: c.isActive,
      })),
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
        .select('bookingReference status depositPayment createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments({ affiliateId: userId }),
    ]);

    successResponse(
      res,
      'Affiliate bookings retrieved',
      bookings,
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
        .populate('userId', 'firstName lastName email')
        .select('bookingReference status depositPayment createdAt numberOfTravellers')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ]);

    successResponse(
      res,
      'Referral bookings retrieved',
      bookings,
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
 * GET /api/v1/affiliates/admin/all
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

    const [affiliates, total] = await Promise.all([
      User.find({ role: 'affiliate' })
        .select('firstName lastName email createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      User.countDocuments({ role: 'affiliate' }),
    ]);

    // Get affiliate codes for each affiliate
    const affiliatesWithCodes = await Promise.all(
      affiliates.map(async (affiliate) => {
        const codes = await AffiliateCode.find({ affiliateId: affiliate._id });
        const totalEarnings = codes.reduce((sum, c) => sum + c.totalEarnings, 0);
        const totalUsage = codes.reduce((sum, c) => sum + c.usageCount, 0);

        return {
          ...affiliate.toObject(),
          codes: codes.map((c) => c.code),
          totalEarnings,
          totalUsage,
        };
      })
    );

    successResponse(
      res,
      'Affiliates retrieved',
      affiliatesWithCodes,
      getPaginationMeta(pageNum, limitNum, total)
    );
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
        .select('firstName lastName email createdAt')
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

// ==================== Withdrawal Routes ====================

/**
 * Request withdrawal (Affiliate)
 * POST /api/v1/affiliates/withdrawals
 */
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