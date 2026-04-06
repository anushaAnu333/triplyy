import { Router } from 'express';
import {
  getDestinations,
  getDestinationBySlug,
  getDestinationAdminBySlug,
  getDestinationsForAdmin,
  createDestination,
  updateDestination,
  deleteDestination,
  getDestinationAvailability,
  uploadDestinationImagesHandler,
  uploadDestinationAdminAttachmentsHandler,
  proxyDestinationAttachmentDownload,
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
import { uploadDestinationImages, uploadDestinationAdminAttachments } from '../utils/upload';

const router = Router();

// Admin: upload destination images (must be before /:slug)
router.post(
  '/upload-images',
  authenticate as any,
  adminOnly as any,
  uploadDestinationImages.array('images', 5),
  (req, res, next) => uploadDestinationImagesHandler(req as AuthRequest, res, next)
);

router.post(
  '/upload-admin-attachments',
  authenticate as any,
  adminOnly as any,
  uploadDestinationAdminAttachments.array('files', 5),
  (req, res, next) => uploadDestinationAdminAttachmentsHandler(req as AuthRequest, res, next)
);

// Admin: list all destinations (active + inactive) - must be before /:slug
router.get(
  '/admin/list',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => getDestinationsForAdmin(req as AuthRequest, res, next)
);

router.get(
  '/admin/by-slug/:slug',
  authenticate as any,
  adminOnly as any,
  validate(destinationSlugValidator),
  (req, res, next) => getDestinationAdminBySlug(req as AuthRequest, res, next)
);

router.post(
  '/download-attachment',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => proxyDestinationAttachmentDownload(req as AuthRequest, res, next)
);

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

