import { Router } from 'express';
import {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
  getDestinationAvailability,
} from '../controllers/destinationController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { validate } from '../middleware/validation';
import {
  destinationValidator,
  destinationIdValidator,
  destinationSlugValidator,
} from '../validators/destinationValidator';
import { AuthRequest } from '../types/custom';

const router = Router();

// Public routes
router.get('/', getDestinations);
router.get('/:slug', validate(destinationSlugValidator), getDestinationBySlug);
router.get('/:id/availability', validate(destinationIdValidator), getDestinationAvailability);

// Admin routes
router.post(
  '/',
  authenticate as any,
  adminOnly as any,
  validate(destinationValidator),
  (req, res, next) => createDestination(req as AuthRequest, res, next)
);

router.put(
  '/:id',
  authenticate as any,
  adminOnly as any,
  validate(destinationIdValidator),
  (req, res, next) => updateDestination(req as AuthRequest, res, next)
);

router.delete(
  '/:id',
  authenticate as any,
  adminOnly as any,
  validate(destinationIdValidator),
  (req, res, next) => deleteDestination(req as AuthRequest, res, next)
);

export default router;

