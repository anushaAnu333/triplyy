import { Request, Response, NextFunction } from 'express';
import { User, AffiliateCode } from '../models';
import { comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailToken,
  verifyEmailToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../utils/jwt';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import { sendEmailVerification, sendPasswordReset } from '../services/emailService';
import logger from '../utils/logger';
import { generateAffiliateCode } from '../utils/generateReference';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    let referredBy: string | undefined;
    let discountAmount: number | undefined;
    let usedReferralCode: string | undefined;

    // Validate and process referral code if provided
    if (referralCode) {
      const referral = await AffiliateCode.findOne({
        code: referralCode.toUpperCase(),
        isActive: true,
        canShareReferral: true, // Only codes that can be shared
      });

      if (!referral) {
        throw new AppError('Invalid or inactive referral code', 400);
      }

      referredBy = referral.affiliateId.toString();
      usedReferralCode = referral.code;

      // Calculate discount
      if (referral.discountPercentage) {
        // Apply percentage discount to default deposit amount
        const defaultDeposit = 199; // AED 199
        discountAmount = (defaultDeposit * referral.discountPercentage) / 100;
      } else if (referral.discountAmount) {
        discountAmount = referral.discountAmount;
      }

      // Increment referral count
      referral.referralCount += 1;
      await referral.save();
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phoneNumber,
      role: 'user',
      referredBy: referredBy ? referredBy : undefined,
      referralCode: usedReferralCode,
      discountAmount,
    });

    // Automatically create a referral code for the new user (so they can refer others)
    try {
      const userReferralCode = generateAffiliateCode(user.firstName.substring(0, 3));
      await AffiliateCode.create({
        affiliateId: user._id,
        code: userReferralCode,
        commissionRate: 10, // Default 10% commission
        commissionType: 'percentage',
        canShareReferral: true, // Regular users can share their referral code
        discountPercentage: 10, // Default 10% discount for referred users
        isActive: true,
      });
      logger.info(`Referral code ${userReferralCode} created for user ${user._id}`);
    } catch (error) {
      // Log error but don't fail registration if referral code creation fails
      logger.error(`Failed to create referral code for user ${user._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate email verification token
    const verificationToken = generateEmailToken(user._id.toString());

    // Send verification email
    await sendEmailVerification(
      user._id.toString(),
      user.email,
      user.firstName,
      verificationToken
    );

    createdResponse(res, 'Registration successful. Please check your email to verify your account.', {
      userId: user._id,
      email: user.email,
      discountApplied: discountAmount ? true : false,
      discountAmount: discountAmount || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified (optional, can be enforced)
    // if (!user.isEmailVerified) {
    //   throw new AppError('Please verify your email before logging in', 401);
    // }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    successResponse(res, 'Login successful', {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError('No refresh token provided', 401);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Generate new access token
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);

    successResponse(res, 'Token refreshed', { accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email address
 * GET /api/v1/auth/verify-email/:token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = verifyEmailToken(token);

    // Update user
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    successResponse(res, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      successResponse(res, 'If an account exists, you will receive a password reset email');
      return;
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user._id.toString());

    // Send reset email
    await sendPasswordReset(
      user._id.toString(),
      user.email,
      user.firstName,
      resetToken
    );

    successResponse(res, 'If an account exists, you will receive a password reset email');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify token
    const decoded = verifyPasswordResetToken(token);

    // Find and update user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    await user.save();

    logger.info(`Password reset for user ${user.email}`);

    successResponse(res, 'Password reset successful. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    successResponse(res, 'User profile retrieved', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/v1/auth/update-profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, phoneNumber, profileImage } = req.body;

    const updateData: Record<string, unknown> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    successResponse(res, 'Profile updated successfully', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage,
    });
  } catch (error) {
    next(error);
  }
};

