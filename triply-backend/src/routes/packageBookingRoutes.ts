import { Router } from 'express';
import {
  createPackageBooking,
  getMyPackageBookings,
  getPackageBookingById,
} from '../controllers/packageBookingController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types/custom';

const router = Router();

router.use(authenticate as any);

router.get('/my', (req, res, next) => getMyPackageBookings(req as AuthRequest, res, next));

router.post('/', (req, res, next) => createPackageBooking(req as AuthRequest, res, next));

router.get('/:id', (req, res, next) => getPackageBookingById(req as AuthRequest, res, next));

export default router;
