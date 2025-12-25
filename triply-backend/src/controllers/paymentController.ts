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
} from '../services/paymentService';
import { notifyDepositPaid } from '../services/notificationService';
import logger from '../utils/logger';
import stripe from '../config/payment';

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

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await handlePaymentSuccess(paymentIntentId, bookingId);
      await notifyDepositPaid(bookingId);

      successResponse(res, 'Payment confirmed successfully', {
        bookingReference: booking.bookingReference,
        status: 'deposit_paid',
      });
    } else {
      throw new AppError('Payment has not been completed', 400);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new AppError('No signature provided', 400);
    }

    // Verify signature
    if (!verifyWebhookSignature(req.body, signature)) {
      throw new AppError('Invalid signature', 400);
    }

    const event = JSON.parse(req.body.toString());

    logger.info(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;

        if (bookingId) {
          await handlePaymentSuccess(paymentIntent.id, bookingId);
          await notifyDepositPaid(bookingId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        const errorMessage = paymentIntent.last_payment_error?.message;

        if (bookingId) {
          await handlePaymentFailure(paymentIntent.id, bookingId, errorMessage);
        }
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
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

