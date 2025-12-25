import rateLimit from 'express-rate-limit';
import env from '../config/environment';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for login attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for password reset requests
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for payment endpoints
 * 3 requests per minute per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 attempts
  message: {
    success: false,
    message: 'Too many payment requests. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

