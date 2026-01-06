import { Router } from 'express';
import {
  getTranslations,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  exportTranslations,
  importTranslations,
} from '../controllers/translationController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public route - get translations
router.get('/', getTranslations);

// Admin routes
router.post(
  '/',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => createTranslation(req as AuthRequest, res, next)
);

router.put(
  '/:id',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => updateTranslation(req as AuthRequest, res, next)
);

router.delete(
  '/:id',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => deleteTranslation(req as AuthRequest, res, next)
);

router.get(
  '/export/:language',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => exportTranslations(req as AuthRequest, res, next)
);

router.post(
  '/import',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => importTranslations(req as AuthRequest, res, next)
);

export default router;
