import { Request, Response, NextFunction } from 'express';
import { User, ReferralPartnerOnboarding } from '../models';
import { successResponse, createdResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import { cleanupFiles } from '../utils/upload';

export const REFERRAL_PARTNER_TERMS_VERSION = '2026-03';

/** Full terms text (single source of truth for API + clients). */
export const REFERRAL_PARTNER_TERMS_TEXT = `TR✨PLY Referral Partner Program
Terms & Conditions

Please read these terms carefully. By accepting, you confirm that you have read, understood, and agree to be bound by the following terms, which constitute a legally binding agreement under the laws of the United Arab Emirates.

1. Program Overview — The TR✨PLY Referral Partner Program allows eligible individuals to earn commission by referring new customers who complete a paid booking through TR✨PLY.

2. Eligibility — You must be 18+, hold valid ID, have a valid bank account for payouts, and not be an employee or agent of TR✨PLY.

3. Commission — Referral Partners earn commission per successful booking using your referral code. Cancelled or refunded bookings do not qualify. Payouts follow the schedule described in the program materials.

4. Payment — Transfers go to your verified bank account. A minimum payout threshold may apply. You are responsible for accurate bank details.

5. Referral Code — Personal and non-transferable. No spam or misleading promotions.

6. Anti-Fraud — Self-referrals and fraudulent activity may result in termination and legal action where applicable.

7. Privacy — Data is processed to run the program in line with applicable UAE data protection law.

8. Changes — TR✨PLY may modify or end the program; material changes will be communicated.

9. Liability — Limited as described in the full terms you accepted in the app.

10. Law — UAE law and jurisdiction as described in the full terms.

Contact: hello@triplysquads.com · +971 52 516 3595
Last updated: March 2026`;

/**
 * Public: referral partner terms (for display before acceptance)
 * GET /api/v1/affiliates/terms
 */
export const getReferralPartnerTerms = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    successResponse(res, 'Referral partner terms', {
      version: REFERRAL_PARTNER_TERMS_VERSION,
      content: REFERRAL_PARTNER_TERMS_TEXT,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/affiliates/terms/accept
 */
export const acceptReferralPartnerTerms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Admins cannot enroll as referral partners', 400);
    if (user.role === 'affiliate') throw new AppError('You are already a referral partner', 400);
    if (user.role === 'merchant') {
      throw new AppError('Merchant accounts use the merchant partner program. Contact support for referral access.', 400);
    }

    const requestedVersion =
      typeof req.body?.version === 'string' ? req.body.version.trim() : '';
    if (
      requestedVersion.length > 0 &&
      requestedVersion !== REFERRAL_PARTNER_TERMS_VERSION
    ) {
      throw new AppError(
        'Outdated terms version. Please refresh the page and accept the latest terms.',
        400
      );
    }
    user.referralPartnerTermsAcceptedAt = new Date();
    user.referralPartnerTermsVersion = REFERRAL_PARTNER_TERMS_VERSION;
    await user.save();

    successResponse(res, 'Referral partner terms accepted', {
      referralPartnerTermsAcceptedAt: user.referralPartnerTermsAcceptedAt,
      referralPartnerTermsVersion: user.referralPartnerTermsVersion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/affiliates/onboarding/status
 */
export const getReferralPartnerOnboardingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const latest = await ReferralPartnerOnboarding.findOne({ userId }).sort({ updatedAt: -1 }).lean();

    successResponse(res, 'Referral partner onboarding status retrieved', {
      status: latest?.status ?? null,
      applicationId: latest?._id?.toString() ?? null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/affiliates/onboarding — same shape as merchant onboarding but no services.
 */
export const submitReferralPartnerOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  const filePaths: string[] = [];
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'affiliate') throw new AppError('You are already a referral partner', 400);
    if (user.role === 'admin') throw new AppError('Admins cannot submit referral partner onboarding', 400);
    if (user.role !== 'user') {
      throw new AppError('Referral partner onboarding is only available for standard accounts', 400);
    }

    const rejectedLatest = await ReferralPartnerOnboarding.findOne({ userId, status: 'rejected' }).sort({
      updatedAt: -1,
    });

    const existingInReview = await ReferralPartnerOnboarding.findOne({
      userId,
      status: { $in: ['pending', 'reapplied'] },
    });
    if (existingInReview) {
      throw new AppError(
        'You already have a referral partner application awaiting review. Please wait before submitting again.',
        400
      );
    }

    if (!user.referralPartnerTermsAcceptedAt && !rejectedLatest) {
      throw new AppError(
        'Please accept the referral partner terms (POST /api/v1/affiliates/terms/accept) before onboarding.',
        400
      );
    }

    const businessType = req.body.businessType as string;
    const categoriesRaw = req.body.categories;
    const businessInfoRaw = req.body.businessInfo;

    if (!businessType || !categoriesRaw || !businessInfoRaw) {
      throw new AppError('businessType, categories and businessInfo are required', 400);
    }

    let categories: string[];
    let businessInfo: Record<string, unknown>;
    try {
      categories = JSON.parse(categoriesRaw as string);
      businessInfo = JSON.parse(businessInfoRaw as string);
    } catch {
      throw new AppError('Invalid JSON in request body', 400);
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      throw new AppError('At least one category is required', 400);
    }

    const acctRaw =
      typeof businessInfo.accountNumber === 'string' ? businessInfo.accountNumber.trim() : '';
    const legacyIban = typeof businessInfo.iban === 'string' ? businessInfo.iban.trim() : '';
    const accountNumber = acctRaw || legacyIban;
    if (!accountNumber) {
      throw new AppError('Account number is required in business information', 400);
    }
    const digitsOnly = accountNumber.replace(/[\s-]/g, '');
    if (digitsOnly.length < 5 || digitsOnly.length > 34 || !/^\d+$/.test(digitsOnly)) {
      throw new AppError('Account number must be 5–34 digits (spaces or dashes allowed)', 400);
    }
    businessInfo.accountNumber = accountNumber;
    delete businessInfo.iban;

    const newUploadPaths: Record<string, string | string[]> = {};
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file.fieldname && file.path) {
          const existing = newUploadPaths[file.fieldname];
          if (!existing) {
            newUploadPaths[file.fieldname] = file.path;
          } else if (Array.isArray(existing)) {
            newUploadPaths[file.fieldname] = [...existing, file.path];
          } else {
            newUploadPaths[file.fieldname] = [existing, file.path];
          }
          filePaths.push(file.path);
        }
      });
    }

    const isResubmission = !!rejectedLatest;
    const mergedDocumentPaths: Record<string, string | string[]> = isResubmission
      ? {
          ...((rejectedLatest?.documentPaths || {}) as Record<string, string | string[]>),
          ...newUploadPaths,
        }
      : newUploadPaths;

    const onboarding = await ReferralPartnerOnboarding.create({
      userId,
      businessType,
      categories,
      businessInfo,
      documentPaths: mergedDocumentPaths,
      status: isResubmission ? 'reapplied' : 'pending',
      previousApplicationId: isResubmission ? rejectedLatest!._id : undefined,
    });

    createdResponse(
      res,
      isResubmission
        ? 'Referral partner application resubmitted. Awaiting admin review.'
        : 'Referral partner application submitted. Awaiting admin review.',
      {
        applicationId: onboarding._id,
        resubmitted: isResubmission,
      }
    );
  } catch (error) {
    if (filePaths.length > 0) cleanupFiles(filePaths);
    next(error);
  }
};
