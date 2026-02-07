import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token not provided', 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as 'user' | 'admin' | 'affiliate' | 'merchant',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require auth
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role as 'user' | 'admin' | 'affiliate' | 'merchant',
        };
      }
    }
    next();
  } catch {
    // Token is invalid, but we don't require auth
    next();
  }
};

