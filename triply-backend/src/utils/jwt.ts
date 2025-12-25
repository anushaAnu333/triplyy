import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/environment';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token (short-lived: 15 minutes)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRE as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Generate JWT refresh token (long-lived: 7 days)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRE as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

/**
 * Generate email verification token
 */
export const generateEmailToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verify email token
 */
export const verifyEmailToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign({ userId, purpose: 'password_reset' }, env.JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): { userId: string } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose: string };
  if (decoded.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }
  return { userId: decoded.userId };
};

