import { Router } from 'express';
import authRoutes from './authRoutes';
import destinationRoutes from './destinationRoutes';
import bookingRoutes from './bookingRoutes';
import availabilityRoutes from './availabilityRoutes';
import affiliateRoutes from './affiliateRoutes';
import paymentRoutes from './paymentRoutes';
import messageRoutes from './messageRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/destinations', destinationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/availability', availabilityRoutes);
router.use('/affiliates', affiliateRoutes);
router.use('/payments', paymentRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TRIPLY API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

