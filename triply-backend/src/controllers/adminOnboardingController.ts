import path from 'path';
import fs from 'fs';
import { Response, NextFunction } from 'express';
import { MerchantOnboarding, User } from '../models';
import { successResponse } from '../utils/apiResponse';
import { getPaginationMeta } from '../utils/apiResponse';
import { AuthRequest } from '../types/custom';
import AppError from '../utils/AppError';

/**
 * List merchant onboarding applications (with optional status filter and pagination)
 * GET /api/v1/admin/onboarding?status=pending|approved|rejected&page=1&limit=10
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
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
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
    if (application.status !== 'pending') {
      throw new AppError(`Application is already ${application.status}`, 400);
    }
    application.status = 'approved';
    await application.save();

    // Promote user to merchant on approval
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
    if (application.status !== 'pending') {
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
    const documentPaths = application.documentPaths as Record<string, string> | undefined;
    const filePath = documentPaths?.[docKey];
    if (!filePath || typeof filePath !== 'string') {
      throw new AppError('Document not found for this application', 404);
    }
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new AppError('File not found on server', 404);
    }
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
