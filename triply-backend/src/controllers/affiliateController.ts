import { Request, Response, NextFunction } from 'express';
import { User, AffiliateCode, Commission, Booking } from '../models';
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
    let paidEarnings = 0;
    let totalBookings = 0;

    commissionStats.forEach((stat) => {
      totalBookings += stat.count;
      totalEarnings += stat.total;
      if (stat._id === 'pending' || stat._id === 'approved') {
        pendingEarnings += stat.total;
      } else if (stat._id === 'paid') {
        paidEarnings += stat.total;
      }
    });

    successResponse(res, 'Dashboard data retrieved', {
      stats: {
        totalBookings,
        totalEarnings,
        pendingEarnings,
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

