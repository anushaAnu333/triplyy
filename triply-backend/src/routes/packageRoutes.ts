import { Router } from 'express';
import {
  getPackages,
  getPackageBySlug,
  getPackagesForAdmin,
  getPackageByIdAdmin,
  uploadPackageImagesHandler,
  createPackage,
  updatePackage,
  deletePackage,
} from '../controllers/packageController';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/roleCheck';
import { AuthRequest } from '../types/custom';
import { uploadDestinationImages } from '../utils/upload';

const router = Router();

router.post(
  '/upload-images',
  authenticate as any,
  adminOnly as any,
  uploadDestinationImages.array('images', 5),
  (req, res, next) => uploadPackageImagesHandler(req as AuthRequest, res, next)
);

router.get(
  '/admin/list',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => getPackagesForAdmin(req as AuthRequest, res, next)
);

router.get(
  '/admin/:id',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => getPackageByIdAdmin(req as AuthRequest, res, next)
);

router.get('/', getPackages);

router.get('/:slug', getPackageBySlug);

router.post(
  '/',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => createPackage(req as AuthRequest, res, next)
);

router.put(
  '/:id',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => updatePackage(req as AuthRequest, res, next)
);

router.delete(
  '/:id',
  authenticate as any,
  adminOnly as any,
  (req, res, next) => deletePackage(req as AuthRequest, res, next)
);

export default router;
