import env from '../config/environment';
import { Booking, AffiliateCode, Commission, User, ActivityBooking } from '../models';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import { generateTransactionReference } from '../utils/generateReference';

interface CreatePaymentIntentParams {
  bookingId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

// Store dummy payment intents in memory (for development/testing)
const dummyPaymentIntents = new Map<string, {
  bookingId: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'succeeded' | 'canceled';
  createdAt: Date;
}>();

/**
 * Payment Gateway - Dummy payment implementation
 */
const createDummyPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> => {
  const { bookingId, amount, currency = 'aed' } = params;
  
  const paymentIntentId = `pi_dummy_${generateTransactionReference()}`;
  const clientSecret = `dummy_secret_${paymentIntentId}`;

  // Store payment intent in memory
  dummyPaymentIntents.set(paymentIntentId, {
    bookingId,
    amount,
    currency,
    status: 'requires_payment_method',
    createdAt: new Date(),
  });

  logger.info(`[DUMMY PAYMENT] Payment intent created: ${paymentIntentId} for booking ${bookingId} (Amount: ${amount} ${currency.toUpperCase()})`);
  logger.warn('[DUMMY PAYMENT] Using dummy payment gateway. Payments will be simulated.');

  return {
    clientSecret,
    paymentIntentId,
  };
};

/**
 * Simulate payment success for dummy gateway
 */
export const simulateDummyPaymentSuccess = async (paymentIntentId: string): Promise<boolean> => {
  const paymentIntent = dummyPaymentIntents.get(paymentIntentId);
  if (!paymentIntent) {
    logger.warn(`[DUMMY PAYMENT] Payment intent not found: ${paymentIntentId}`);
    return false;
  }

  paymentIntent.status = 'succeeded';
  logger.info(`[DUMMY PAYMENT] Payment succeeded: ${paymentIntentId} for booking ${paymentIntent.bookingId}`);
  
  // Process payment success
  await handlePaymentSuccess(paymentIntentId, paymentIntent.bookingId);
  return true;
};

/**
 * Simulate payment failure for dummy gateway
 */
export const simulateDummyPaymentFailure = async (paymentIntentId: string, errorMessage?: string): Promise<boolean> => {
  const paymentIntent = dummyPaymentIntents.get(paymentIntentId);
  if (!paymentIntent) {
    logger.warn(`[DUMMY PAYMENT] Payment intent not found: ${paymentIntentId}`);
    return false;
  }

  paymentIntent.status = 'canceled';
  logger.warn(`[DUMMY PAYMENT] Payment failed: ${paymentIntentId} for booking ${paymentIntent.bookingId} - ${errorMessage || 'Payment declined'}`);
  
  // Process payment failure
  await handlePaymentFailure(paymentIntentId, paymentIntent.bookingId, errorMessage);
  return true;
};

/**
 * Create a payment intent for deposit
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> => {
  const { bookingId, amount, currency = 'aed' } = params;

  // Validate amount
  if (!amount || amount <= 0) {
    logger.error(`Invalid amount for payment intent: ${amount}`);
    throw new AppError('Invalid payment amount. Amount must be greater than 0.', 400);
  }

  // Validate minimum amount (at least 0.50 AED)
  if (amount < 0.5) {
    logger.error(`Amount too small: ${amount}`);
    throw new AppError('Payment amount is too small. Minimum amount is 0.50 AED.', 400);
  }

  // Use dummy payment gateway
  return createDummyPaymentIntent(params);
};

/**
 * Handle successful payment webhook
 */
export const handlePaymentSuccess = async (
  paymentIntentId: string,
  bookingId: string
): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Update booking status
    booking.status = 'deposit_paid';
    booking.depositPayment.paymentStatus = 'completed';
    booking.depositPayment.transactionId = paymentIntentId;
    booking.depositPayment.paidAt = new Date();

    // Unlock calendar for 1 year
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + env.CALENDAR_UNLOCK_DURATION_DAYS);
    booking.calendarUnlockedUntil = unlockDate;

    await booking.save();

    // Process linked activity bookings if this is a combined payment
    if (booking.linkedActivityBookings && booking.linkedActivityBookings.length > 0) {
      logger.info(`Processing ${booking.linkedActivityBookings.length} linked activity bookings for booking ${booking.bookingReference}`);
      
      const activityBookings = await ActivityBooking.find({
        _id: { $in: booking.linkedActivityBookings },
      });

      const { ActivityAvailability } = await import('../models');
      
      for (const activityBooking of activityBookings) {
        if (activityBooking.status === 'pending_payment') {
          activityBooking.status = 'payment_completed';
          activityBooking.payment.paymentStatus = 'completed';
          activityBooking.payment.transactionId = paymentIntentId;
          activityBooking.payment.paidAt = new Date();
          await activityBooking.save();
          
          // Update availability booked slots
          if (activityBooking.availabilityId) {
            const availability = await ActivityAvailability.findById(activityBooking.availabilityId);
            if (availability) {
              availability.bookedSlots = (availability.bookedSlots || 0) + activityBooking.numberOfParticipants;
              await availability.save();
              logger.info(`Updated availability bookedSlots: ${availability.bookedSlots} for activity booking ${activityBooking.bookingReference}`);
            }
          }
          
          logger.info(`Activity booking ${activityBooking.bookingReference} marked as payment_completed`);
        }
      }
    }

    // Process affiliate commission if applicable
    if (booking.affiliateCode && booking.affiliateId) {
      await processAffiliateCommission(booking);
    }

    // Process referral commission if user was referred
    const user = await User.findById(booking.userId);
    if (user?.referredBy && user?.referralCode) {
      await processReferralCommission(booking, user);
    }

    logger.info(`Payment successful for booking ${booking.bookingReference}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    logger.error(`Failed to process payment success: ${message}`);
    throw error;
  }
};

/**
 * Process affiliate commission on successful payment
 */
const processAffiliateCommission = async (booking: typeof Booking.prototype): Promise<void> => {
  try {
    const affiliateCode = await AffiliateCode.findOne({
      code: booking.affiliateCode,
      isActive: true,
    });

    if (!affiliateCode) {
      logger.warn(`Affiliate code ${booking.affiliateCode} not found or inactive`);
      return;
    }

    // Calculate commission
    let commissionAmount: number;
    if (affiliateCode.commissionType === 'fixed') {
      commissionAmount = affiliateCode.fixedAmount || 0;
    } else {
      commissionAmount = (booking.depositPayment.amount * affiliateCode.commissionRate) / 100;
    }

    // Create commission record
    await Commission.create({
      affiliateId: affiliateCode.affiliateId,
      bookingId: booking._id,
      affiliateCode: booking.affiliateCode,
      bookingAmount: booking.depositPayment.amount,
      commissionAmount,
      commissionRate: affiliateCode.commissionRate,
      status: 'pending',
    });

    // Update affiliate code usage stats
    affiliateCode.usageCount += 1;
    affiliateCode.totalEarnings += commissionAmount;
    await affiliateCode.save();

    logger.info(`Commission ${commissionAmount} created for affiliate ${booking.affiliateCode}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Commission processing failed';
    logger.error(`Failed to process affiliate commission: ${message}`);
    // Don't throw - commission failure shouldn't fail the booking
  }
};

/**
 * Process referral commission on successful payment
 */
const processReferralCommission = async (
  booking: typeof Booking.prototype,
  user: typeof User.prototype
): Promise<void> => {
  try {
    // Find the referral code used during signup
    const referralCode = await AffiliateCode.findOne({
      code: user.referralCode,
      canShareReferral: true,
      isActive: true,
    });

    if (!referralCode) {
      logger.warn(`Referral code ${user.referralCode} not found or not eligible for referral sharing`);
      return;
    }

    // Get the referrer (the user who shared the code)
    const referrer = await User.findById(user.referredBy);
    if (!referrer) {
      logger.warn(`Referrer ${user.referredBy} not found`);
      return;
    }

    // Calculate commission based on original deposit amount (before discount)
    const originalDepositAmount = booking.depositPayment.amount + (user.discountAmount || 0);
    
    // Calculate commission based on referral code settings
    let commissionAmount: number;
    if (referralCode.discountAmount) {
      // Fixed commission based on discount amount
      commissionAmount = referralCode.discountAmount * 0.5; // 50% of discount as commission
    } else if (referralCode.discountPercentage) {
      // Percentage commission based on original deposit
      commissionAmount = (originalDepositAmount * referralCode.discountPercentage) / 100;
    } else {
      // Default: 10% of original deposit
      commissionAmount = (originalDepositAmount * 10) / 100;
    }

    // Create commission record for the referrer
    await Commission.create({
      affiliateId: referralCode.affiliateId,
      bookingId: booking._id,
      affiliateCode: user.referralCode,
      bookingAmount: originalDepositAmount,
      commissionAmount,
      commissionRate: referralCode.discountPercentage || 10,
      status: 'pending',
      metadata: {
        type: 'referral',
        referredUserId: user._id.toString(),
      },
    });

    // Update referral code stats
    referralCode.referralCount += 1;
    await referralCode.save();

    logger.info(`Referral commission ${commissionAmount} created for referrer ${referrer.email}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Referral commission processing failed';
    logger.error(`Failed to process referral commission: ${message}`);
    // Don't throw - commission failure shouldn't fail the booking
  }
};

/**
 * Handle failed payment webhook
 */
export const handlePaymentFailure = async (
  paymentIntentId: string,
  bookingId: string,
  errorMessage?: string
): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    booking.depositPayment.paymentStatus = 'failed';
    booking.depositPayment.transactionId = paymentIntentId;
    await booking.save();

    logger.warn(`Payment failed for booking ${booking.bookingReference}: ${errorMessage}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failure handling failed';
    logger.error(`Failed to handle payment failure: ${message}`);
    throw error;
  }
};

/**
 * Process refund for a booking
 */
export const processRefund = async (
  bookingId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (!booking.depositPayment.transactionId) {
      throw new AppError('No payment found to refund', 400);
    }

    // Process refund for dummy payments
    logger.info(`[DUMMY PAYMENT] Refund processed for booking ${booking.bookingReference}`);
    booking.depositPayment.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund processing failed';
    logger.error(`Failed to process refund: ${message}`);
    throw new AppError('Failed to process refund. Please contact support.', 500);
  }
};

/**
 * Verify webhook signature (for future payment gateway integration)
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): boolean => {
  // For dummy payment gateway, always return true
  logger.info('[DUMMY PAYMENT] Webhook signature verification skipped (dummy mode)');
  return true;
};

