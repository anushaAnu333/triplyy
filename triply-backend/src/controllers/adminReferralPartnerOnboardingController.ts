import path from 'path';
import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { ReferralPartnerOnboarding, User, AffiliateCode } from '../models';
import { successResponse, getPaginationMeta } from '../utils/apiResponse';
import { AuthRequest } from '../types/custom';
import AppError from '../utils/AppError';
import { cleanupFiles, resolveUploadPathForServing } from '../utils/upload';
import { generateAffiliateCode } from '../utils/generateReference';
import logger from '../utils/logger';
import {
  sendReferralPartnerOnboardingApprovedEmail,
  sendReferralPartnerOnboardingRejectedEmail,
} from '../services/emailService';

function isMongoTransactionUnsupportedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: number; codeName?: string })?.code;
  const codeName = (err as { codeName?: string })?.codeName;
  return (
    code === 20 ||
    codeName === 'IllegalOperation' ||
    msg.includes('replica set') ||
    msg.includes('Transaction numbers are only allowed') ||
    msg.includes('mongos')
  );
}

/**
 * GET /api/v1/admin/referral-partner-onboarding
 */
export const listReferralPartnerApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = '1', limit = '10' } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    const allowed = ['pending', 'reapplied', 'approved', 'rejected'];
    if (status && allowed.includes(status)) {
      if (status === 'pending') {
        query.status = { $in: ['pending', 'reapplied'] };
      } else {
        query.status = status;
      }
    }

    const [applications, total] = await Promise.all([
      ReferralPartnerOnboarding.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReferralPartnerOnboarding.countDocuments(query),
    ]);

    successResponse(res, 'Referral partner applications retrieved', applications, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/referral-partner-onboarding/:id
 */
export const getReferralPartnerApplicationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await ReferralPartnerOnboarding.findById(id)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('previousApplicationId', 'status createdAt businessInfo')
      .lean();
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    successResponse(res, 'Application retrieved', application);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/referral-partner-onboarding/:id/approve
 */
export const approveReferralPartnerApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await ReferralPartnerOnboarding.findById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    if (!['pending', 'reapplied'].includes(application.status)) {
      throw new AppError(`Application is already ${application.status}`, 400);
    }

    const user = await User.findById(application.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user.role === 'admin') {
      throw new AppError('Cannot approve admin user', 400);
    }

    application.status = 'approved';
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await application.save({ session });
        if (user.role !== 'affiliate') {
          user.role = 'affiliate';
          await user.save({ session });
        }
      });
    } catch (err) {
      if (isMongoTransactionUnsupportedError(err)) {
        await application.save();
        if (user.role !== 'affiliate') {
          user.role = 'affiliate';
          await user.save();
        }
      } else {
        throw err;
      }
    } finally {
      await session.endSession();
    }

    const existingCode = await AffiliateCode.findOne({ affiliateId: user._id });
    let affiliateCodeForEmail: string;
    if (!existingCode) {
      const code = generateAffiliateCode(user.firstName);
      await AffiliateCode.create({
        affiliateId: user._id,
        code,
        commissionRate: 10,
        commissionType: 'percentage',
        canShareReferral: true,
        discountPercentage: 10,
      });
      affiliateCodeForEmail = code;
      logger.info(`Created affiliate code for referral partner onboarding ${id}`);
    } else {
      affiliateCodeForEmail = existingCode.code;
    }

    sendReferralPartnerOnboardingApprovedEmail(user._id.toString(), affiliateCodeForEmail).catch((err) => {
      logger.error('Referral partner onboarding approval email failed:', err);
    });

    successResponse(res, 'Referral partner approved and affiliate code ensured', application);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/referral-partner-onboarding/:id/reject
 */
export const rejectReferralPartnerApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body || {};
    const application = await ReferralPartnerOnboarding.findById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    if (!['pending', 'reapplied'].includes(application.status)) {
      throw new AppError(`Application is already ${application.status}`, 400);
    }
    application.status = 'rejected';
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    const biz = (application.businessInfo as Record<string, unknown>) || {};
    const businessName =
      typeof biz.businessName === 'string' && biz.businessName.trim().length
        ? biz.businessName.trim()
        : 'Your application';
    sendReferralPartnerOnboardingRejectedEmail(
      application.userId.toString(),
      businessName,
      typeof rejectionReason === 'string' ? rejectionReason : undefined
    ).catch((err) => {
      logger.error('Referral partner onboarding rejection email failed:', err);
    });

    successResponse(res, 'Application rejected', application);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/referral-partner-onboarding/:id/documents/:docKey
 */
export const getReferralPartnerDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, docKey } = req.params;
    const application = await ReferralPartnerOnboarding.findById(id).lean();
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    const documentPaths = application.documentPaths as Record<string, string | string[]> | undefined;
    const filePathOrPaths = documentPaths?.[docKey];
    const filePath = Array.isArray(filePathOrPaths) ? filePathOrPaths[0] : filePathOrPaths;
    if (!filePath || typeof filePath !== 'string') {
      throw new AppError('Document not found for this application', 404);
    }
    const resolvedPath = resolveUploadPathForServing(filePath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(resolvedPath);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/referral-partner-onboarding/:id
 */
export const deleteReferralPartnerApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await ReferralPartnerOnboarding.findById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const documentPaths = (application.documentPaths || {}) as Record<string, string | string[]>;
    const filesToDelete = Object.values(documentPaths).flatMap((filePath) => {
      if (typeof filePath === 'string') return filePath.trim().length ? [filePath] : [];
      if (Array.isArray(filePath)) return filePath.filter((p) => typeof p === 'string' && p.trim().length > 0);
      return [];
    });
    if (filesToDelete.length > 0) {
      cleanupFiles(filesToDelete);
    }

    await application.deleteOne();
    successResponse(res, 'Application deleted successfully');
  } catch (error) {
    next(error);
  }
};
