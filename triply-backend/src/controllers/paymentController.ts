import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models';
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

