import { Request, Response, NextFunction } from 'express';
import { Booking, ActivityBooking, ActivityAvailability } from '../models';
import { successResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
  verifyWebhookSignature,
  simulateDummyPaymentSuccess,
  simulateDummyPaymentFailure,
} from '../services/paymentService';
import env from '../config/environment';
import { notifyDepositPaid } from '../services/notificationService';
import logger from '../utils/logger';

/**
 * Create payment intent
 * POST /api/v1/payments/create-intent
 */
export const createIntent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    // Find booking and verify ownership
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== 'pending_deposit') {
      throw new AppError('Payment has already been processed for this booking', 400);
    }

    const paymentIntent = await createPaymentIntent({
      bookingId: booking._id.toString(),
      amount: booking.depositPayment.amount,
      currency: booking.depositPayment.currency,
      metadata: {
        bookingReference: booking.bookingReference,
        userId,
      },
    });

    successResponse(res, 'Payment intent created', {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: booking.depositPayment.amount,
      currency: booking.depositPayment.currency,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (client-side confirmation)
 * POST /api/v1/payments/confirm
 */
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.userId;

    // Verify booking ownership
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Process payment using dummy payment gateway
    logger.info(`[DUMMY PAYMENT] Simulating payment success for ${paymentIntentId}`);
    const success = await simulateDummyPaymentSuccess(paymentIntentId);
    
    if (success) {
      await notifyDepositPaid(bookingId);
      successResponse(res, 'Payment confirmed successfully', {
        bookingReference: booking.bookingReference,
        status: 'deposit_paid',
      });
    } else {
      throw new AppError('Failed to process payment', 400);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Handle payment webhook (for future payment gateway integration)
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // For dummy payment gateway, webhooks are not used
    // This endpoint is kept for future payment gateway integration
    logger.info('[DUMMY PAYMENT] Webhook received but not processed (dummy mode)');
    res.status(200).json({ received: true, message: 'Webhook not processed in dummy mode' });
  } catch (error) {
    next(error);
  }
};

/**
 * Simulate payment (for testing)
 * POST /api/v1/payments/simulate
 */
export const simulatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentIntentId, bookingId, success = true } = req.body;
    const userId = req.user.userId;

    // Verify booking ownership
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (success) {
      const result = await simulateDummyPaymentSuccess(paymentIntentId);
      if (result) {
        await notifyDepositPaid(bookingId);
        successResponse(res, 'Payment simulated successfully', {
          bookingReference: booking.bookingReference,
          status: 'deposit_paid',
        });
      } else {
        throw new AppError('Failed to simulate payment', 400);
      }
    } else {
      const result = await simulateDummyPaymentFailure(paymentIntentId, 'Payment simulation failed');
      if (result) {
        successResponse(res, 'Payment failure simulated', {
          bookingReference: booking.bookingReference,
          status: booking.status,
        });
      } else {
        throw new AppError('Failed to simulate payment failure', 400);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment details for a booking
 * GET /api/v1/payments/booking/:bookingId
 */
export const getPaymentDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const query: Record<string, unknown> = { _id: bookingId };
    if (!isAdmin) {
      query.userId = userId;
    }

    const booking = await Booking.findOne(query).select(
      'bookingReference depositPayment status'
    );

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    successResponse(res, 'Payment details retrieved', {
      bookingReference: booking.bookingReference,
      depositPayment: booking.depositPayment,
      status: booking.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment intent for activity booking
 * POST /api/v1/payments/activity-booking/create-intent
 */
export const createActivityBookingPaymentIntent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    logger.info(`[PAYMENT] Creating activity booking payment intent: bookingId=${bookingId}, userId=${userId}, role=${userRole}`);

    // First, check if booking exists at all (without any filters)
    let booking = await ActivityBooking.findById(bookingId)
      .populate('activityId');
    
    if (!booking) {
      logger.error(`[PAYMENT] Activity booking does not exist in database: bookingId=${bookingId}`);
      throw new AppError('Activity booking not found', 404);
    }

    logger.info(`[PAYMENT] Booking found in database: ${booking.bookingReference}, userId=${booking.userId}, activityId=${booking.activityId}`);

    // Check permissions
    const bookingUserId = String(booking.userId);
    const currentUserId = String(userId);
    const isBookingOwner = bookingUserId === currentUserId;
    
    // For merchants: allow if they created the booking OR if they own the activity
    // For regular users: only allow if they created the booking
    if (userRole === 'merchant') {
      if (isBookingOwner) {
        logger.info(`[PAYMENT] Access granted: merchant ${userId} created the booking`);
      } else {
        // Check if merchant owns the activity
        const activity = booking.activityId as any;
        if (activity?.merchantId) {
          const activityMerchantId = String(activity.merchantId);
          const userMerchantId = String(userId);
          
          logger.info(`[PAYMENT] Merchant check: activityMerchantId=${activityMerchantId}, userMerchantId=${userMerchantId}`);
          
          if (activityMerchantId === userMerchantId) {
            logger.info(`[PAYMENT] Access granted: merchant ${userId} owns the activity`);
          } else {
            logger.warn(`[PAYMENT] Access denied: merchant ${userId} does not own booking or activity for booking ${bookingId}`);
            throw new AppError('Activity booking not found', 404);
          }
        } else {
          logger.warn(`[PAYMENT] Activity has no merchantId for booking ${bookingId}`);
          throw new AppError('Activity booking not found', 404);
        }
      }
    } else {
      // Regular users can only access their own bookings
      if (!isBookingOwner) {
        logger.warn(`[PAYMENT] Access denied: user ${userId} does not own booking ${bookingId} (booking userId: ${bookingUserId})`);
        throw new AppError('Activity booking not found', 404);
      }
    }

    logger.info(`[PAYMENT] Booking found: ${booking.bookingReference}, status: ${booking.status}`);

    if (booking.status !== 'pending_payment') {
      throw new AppError('Payment has already been processed for this booking', 400);
    }

    const paymentIntent = await createPaymentIntent({
      bookingId: booking._id.toString(),
      amount: booking.payment.amount,
      currency: booking.payment.currency,
      metadata: {
        bookingReference: booking.bookingReference,
        userId,
        type: 'activity_booking',
      },
    });

    successResponse(res, 'Payment intent created', {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: booking.payment.amount,
      currency: booking.payment.currency,
      triplyCommission: booking.payment.triplyCommission,
      merchantAmount: booking.payment.merchantAmount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm activity booking payment
 * POST /api/v1/payments/activity-booking/confirm
 */
export const confirmActivityBookingPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    logger.info(`[PAYMENT] Confirming activity booking payment: bookingId=${bookingId}, userId=${userId}, role=${userRole}`);

    // First, check if booking exists at all (without any filters)
    let booking = await ActivityBooking.findById(bookingId)
      .populate('activityId')
      .populate('availabilityId');
    
    if (!booking) {
      logger.error(`[PAYMENT] Activity booking does not exist in database: bookingId=${bookingId}`);
      throw new AppError('Activity booking not found', 404);
    }

    logger.info(`[PAYMENT] Booking found in database: ${booking.bookingReference}, userId=${booking.userId}, activityId=${booking.activityId}`);

    // Check permissions - for merchants, allow access to bookings for their activities
    // For regular users, only allow access to their own bookings
    if (userRole === 'merchant') {
      // Merchants can access bookings for their activities
      const activity = booking.activityId as any;
      if (activity?.merchantId) {
        // merchantId can be ObjectId or string, handle both
        const activityMerchantId = String(activity.merchantId);
        const userMerchantId = String(userId);
        
        logger.info(`[PAYMENT] Merchant check: activityMerchantId=${activityMerchantId}, userMerchantId=${userMerchantId}`);
        
        if (activityMerchantId !== userMerchantId) {
          logger.warn(`[PAYMENT] Access denied: merchant ${userId} does not own activity for booking ${bookingId}`);
          throw new AppError('Activity booking not found', 404);
        }
      } else {
        logger.warn(`[PAYMENT] Activity has no merchantId for booking ${bookingId}`);
        throw new AppError('Activity booking not found', 404);
      }
    } else {
      // Regular users can only access their own bookings
      const bookingUserId = String(booking.userId);
      const userMerchantId = String(userId);
      
      if (bookingUserId !== userMerchantId) {
        logger.warn(`[PAYMENT] Access denied: user ${userId} does not own booking ${bookingId} (booking userId: ${bookingUserId})`);
        throw new AppError('Activity booking not found', 404);
      }
    }

    logger.info(`[PAYMENT] Booking found: ${booking.bookingReference}, status: ${booking.status}`);

    // Process payment using dummy payment gateway
    logger.info(`[DUMMY PAYMENT] Simulating activity booking payment success for ${paymentIntentId}`);
    const success = await simulateDummyPaymentSuccess(paymentIntentId);
    
    if (success) {
      // Update booking status
      booking.status = 'payment_completed';
      booking.payment.paymentStatus = 'completed';
      booking.payment.paidAt = new Date();
      booking.payment.transactionId = paymentIntentId;
      await booking.save();

      // Update availability booked slots
      if (booking.availabilityId) {
        const { ActivityAvailability } = await import('../models');
        const availability = await ActivityAvailability.findById(booking.availabilityId);
        if (availability) {
          availability.bookedSlots = (availability.bookedSlots || 0) + booking.numberOfParticipants;
          await availability.save();
          logger.info(`Updated availability bookedSlots: ${availability.bookedSlots} for availability ${booking.availabilityId}`);
        }
      }

      // Send confirmation emails (you can add email service here)
      logger.info(`Activity booking ${booking.bookingReference} payment completed`);

      successResponse(res, 'Payment confirmed successfully', {
        bookingReference: booking.bookingReference,
        status: booking.status,
        payment: {
          amount: booking.payment.amount,
          triplyCommission: booking.payment.triplyCommission,
          merchantAmount: booking.payment.merchantAmount,
        },
      });
    } else {
      throw new AppError('Failed to process payment', 400);
    }
  } catch (error) {
    next(error);
  }
};