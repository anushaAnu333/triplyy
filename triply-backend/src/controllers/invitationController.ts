import { Response, NextFunction } from 'express';
import { Invitation, User } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, PaginationQuery } from '../types/custom';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '../services/emailService';
import logger from '../utils/logger';

/**
 * Create invitation (Admin)
 * POST /api/v1/admin/invitations
 */
export const createInvitation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, role } = req.body;
    const invitedBy = req.user.userId;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Check if there's a pending invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new AppError('An invitation has already been sent to this email', 400);
    }

    // Generate invitation token
    const token = uuidv4();

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      role,
      token,
      invitedBy,
      expiresAt,
      status: 'pending',
    });

    // Send invitation email
    await sendInvitationEmail(
      invitation.email,
      invitation.role,
      invitation.token,
      invitedBy
    );

    createdResponse(res, 'Invitation sent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invitations (Admin)
 * GET /api/v1/admin/invitations
 */
export const getAllInvitations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query as PaginationQuery & {
      status?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [invitations, total] = await Promise.all([
      Invitation.find(query)
        .populate('invitedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Invitation.countDocuments(query),
    ]);

    // Mark expired invitations
    for (const invitation of invitations) {
      if (invitation.status === 'pending' && invitation.expiresAt < new Date()) {
        invitation.status = 'expired';
        await invitation.save();
      }
    }

    successResponse(
      res,
      'Invitations retrieved successfully',
      invitations,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend invitation (Admin)
 * POST /api/v1/admin/invitations/:id/resend
 */
export const resendInvitation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.status === 'accepted') {
      throw new AppError('Invitation has already been accepted', 400);
    }

    // Generate new token and extend expiry
    invitation.token = uuidv4();
    invitation.expiresAt = new Date();
    invitation.expiresAt.setDate(invitation.expiresAt.getDate() + 7);
    invitation.status = 'pending';
    await invitation.save();

    // Send invitation email
    await sendInvitationEmail(
      invitation.email,
      invitation.role,
      invitation.token,
      invitation.invitedBy.toString()
    );

    successResponse(res, 'Invitation resent successfully', invitation);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel invitation (Admin)
 * DELETE /api/v1/admin/invitations/:id
 */
export const cancelInvitation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findByIdAndDelete(id);
    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    successResponse(res, 'Invitation cancelled successfully');
  } catch (error) {
    next(error);
  }
};
