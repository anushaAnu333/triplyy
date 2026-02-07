import { Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';

type Role = 'user' | 'admin' | 'affiliate' | 'merchant';

/**
 * Role-based access control middleware
 * Restricts access to specific user roles
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = requireRole('admin');

/**
 * Affiliate only middleware
 */
export const affiliateOnly = requireRole('affiliate');

/**
 * Admin or affiliate middleware
 */
export const adminOrAffiliate = requireRole('admin', 'affiliate');

/**
 * Merchant only middleware
 */
export const merchantOnly = requireRole('merchant');
