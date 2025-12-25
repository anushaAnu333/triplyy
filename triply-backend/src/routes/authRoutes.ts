import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
} from '../validators/authValidator';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', loginLimiter, validate(loginValidator), login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordValidator), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidator), resetPassword);

// Protected routes
router.post('/logout', authenticate as any, logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate as any, (req, res, next) => getMe(req as AuthRequest, res, next));
router.put('/update-profile', authenticate as any, validate(updateProfileValidator), (req, res, next) => updateProfile(req as AuthRequest, res, next));

export default router;

