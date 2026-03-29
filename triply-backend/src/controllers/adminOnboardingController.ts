import path from 'path';
import { Response, NextFunction } from 'express';
import { Activity, MerchantOnboarding, User } from '../models';
import { successResponse } from '../utils/apiResponse';
import { getPaginationMeta } from '../utils/apiResponse';
import { AuthRequest } from '../types/custom';
import AppError from '../utils/AppError';
import { cleanupFiles, resolveUploadPathForServing } from '../utils/upload';
import { uploadImages } from '../utils/cloudinary';
import { sendMerchantOnboardingRejectedEmail } from '../services/emailService';
import logger from '../utils/logger';

/**
 * List merchant onboarding applications (with optional status filter and pagination)
 * GET /api/v1/admin/onboarding?status=pending|reapplied|approved|rejected&page=1&limit=10
 * Note: status=pending returns both pending and reapplied (both need review).
 */
export const getOnboardingApplications = async (
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
      MerchantOnboarding.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MerchantOnboarding.countDocuments(query),
    ]);

    const meta = getPaginationMeta(pageNum, limitNum, total);
    successResponse(res, 'Onboarding applications retrieved', applications, meta);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single onboarding application by ID
 * GET /api/v1/admin/onboarding/:id
 */
export const getOnboardingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await MerchantOnboarding.findById(id)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('previousApplicationId', 'status createdAt businessInfo')
      .lean();
    if (!application) {
      throw new AppError('Onboarding application not found', 404);
    }
    successResponse(res, 'Application retrieved', application);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve onboarding application
 * PUT /api/v1/admin/onboarding/:id/approve
 */
export const approveOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await MerchantOnboarding.findById(id);
    if (!application) {
      throw new AppError('Onboarding application not found', 404);
    }
    if (!['pending', 'reapplied'].includes(application.status)) {
      throw new AppError(`Application is already ${application.status}`, 400);
    }

    // Create customer-facing activities from the approved onboarding services.
    // This makes the merchant dashboard show their onboarding services immediately.
    const biz = (application.businessInfo as Record<string, unknown>) || {};
    const location =
      typeof biz.emirate === 'string' && biz.emirate.trim().length ? biz.emirate.trim() : 'Dubai';
    const currency = typeof biz.currency === 'string' && biz.currency.trim().length ? biz.currency.trim() : 'AED';

    const docPaths = (application.documentPaths || {}) as Record<string, string | string[]>;
    const services = Array.isArray(application.services) ? application.services : [];

    // Best-effort: only create activities for services that have at least one photo path.
    for (let index = 0; index < services.length; index += 1) {
      const svc = services[index] as Record<string, unknown>;

      const photosKey = `service_${index}_photos`;
      const rawPhotoPaths = docPaths[photosKey];
      const photoPaths: string[] =
        typeof rawPhotoPaths === 'string'
          ? [rawPhotoPaths]
          : Array.isArray(rawPhotoPaths)
            ? rawPhotoPaths.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
            : [];

      if (!photoPaths.length) {
        logger.warn(`No photo paths found for ${photosKey}. Skipping service creation.`);
        continue;
      }

      const photoUploads = await uploadImages(photoPaths.slice(0, 3));
      const photoUrls = photoUploads.map((u) => u.url);

      const parseMultilineList = (val: unknown): string[] | undefined => {
        if (typeof val !== 'string') return undefined;
        const arr = val
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean);
        return arr.length ? arr : undefined;
      };

      const parseOptionalNumber = (val: unknown): number | undefined => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (!trimmed) return undefined;
          const parsed = parseFloat(trimmed);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };

      const parseOptionalInt = (val: unknown): number | undefined => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return Number.isFinite(val) ? Math.trunc(val) : undefined;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (!trimmed) return undefined;
          const parsed = parseInt(trimmed, 10);
          return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
      };

      const parsePointGroups = (
        val: unknown
      ): Array<{ text: string; subPoints: string[] }> | undefined => {
        if (!Array.isArray(val)) return undefined;
        const groups = val
          .map((g) => {
            if (!g || typeof g !== 'object') return null;
            const record = g as { text?: unknown; subPoints?: unknown };
            const text = typeof record.text === 'string' ? record.text.trim() : '';
            const subPoints = Array.isArray(record.subPoints)
              ? record.subPoints
                  .map((sp) => (typeof sp === 'string' ? sp.trim() : String(sp).trim()))
                  .filter(Boolean)
              : [];
            if (!text && subPoints.length === 0) return null;
            return { text, subPoints };
          })
          .filter((x): x is { text: string; subPoints: string[] } => !!x && typeof x.text === 'string');
        return groups.length ? groups : undefined;
      };

      const title = typeof svc.title === 'string' ? svc.title.trim() : '';
      const description = typeof svc.description === 'string' ? svc.description.trim() : '';
      const price = parseOptionalNumber(svc.price);

      if (!title || !description || price === undefined) {
        logger.warn(`Service at index ${index} missing title/description/price. Skipping activity.`);
        continue;
      }

      const activity = await Activity.create({
        merchantId: application.userId,
        title,
        description,
        location,
        price,
        currency,
        photos: photoUrls,
        status: 'approved',
        duration: typeof svc.duration === 'string' ? svc.duration.trim() : undefined,
        groupSize:
          svc.groupSize === null
            ? undefined
            : parseOptionalInt(svc.groupSize),
        languages: typeof svc.languages === 'string' ? svc.languages.trim() : undefined,
        pointsHeading: typeof svc.pointsHeading === 'string' ? svc.pointsHeading.trim() : undefined,
        pointGroups: parsePointGroups(svc.pointGroups),
        includes: parseMultilineList(svc.includes),
        excludes: parseMultilineList(svc.excludes),
      });

      // Clean up onboarding service image files after upload.
      cleanupFiles(photoPaths);

      logger.info(`Created activity ${activity._id.toString()} from onboarding service index ${index}`);
    }

    // Mark onboarding as approved and promote user only after activities are created successfully.
    application.status = 'approved';
    await application.save();

    const user = await User.findById(application.userId);
    if (!user) {
      throw new AppError('Associated user not found for this application', 404);
    }
    if (user.role !== 'merchant') {
      user.role = 'merchant';
      await user.save();
    }

    successResponse(res, 'Application approved and user promoted to merchant', application);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject onboarding application and revert user role to 'user'
 * PUT /api/v1/admin/onboarding/:id/reject
 * Body: { rejectionReason?: string }
 */
export const rejectOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body || {};
    const application = await MerchantOnboarding.findById(id);
    if (!application) {
      throw new AppError('Onboarding application not found', 404);
    }
    if (!['pending', 'reapplied'].includes(application.status)) {
      throw new AppError(`Application is already ${application.status}`, 400);
    }
    application.status = 'rejected';
    if (rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    // Revert user role to 'user' so they are no longer a merchant
    const user = await User.findById(application.userId);
    if (user && user.role === 'merchant') {
      user.role = 'user';
      await user.save();
    }

    const biz = (application.businessInfo as Record<string, unknown>) || {};
    const businessName = typeof biz.businessName === 'string' ? biz.businessName : 'Your application';
    sendMerchantOnboardingRejectedEmail(
      application.userId.toString(),
      businessName,
      rejectionReason
    ).catch((err) => {
      logger.error('Merchant onboarding rejection email failed:', err);
    });

    successResponse(res, 'Application rejected', application);
  } catch (error) {
    next(error);
  }
};

/**
 * Serve a single onboarding document file (admin only)
 * GET /api/v1/admin/onboarding/:id/documents/:docKey
 */
export const getOnboardingDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, docKey } = req.params;
    const application = await MerchantOnboarding.findById(id).lean();
    if (!application) {
      throw new AppError('Onboarding application not found', 404);
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
 * Delete onboarding application (admin only)
 * DELETE /api/v1/admin/onboarding/:id
 */
export const deleteOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await MerchantOnboarding.findById(id);
    if (!application) {
      throw new AppError('Onboarding application not found', 404);
    }

    // If approved onboarding is deleted, revert user role from merchant to user.
    const user = await User.findById(application.userId);
    if (application.status === 'approved' && user?.role === 'merchant') {
      user.role = 'user';
      await user.save();
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
    successResponse(res, 'Onboarding application deleted successfully');
  } catch (error) {
    next(error);
  }
};
