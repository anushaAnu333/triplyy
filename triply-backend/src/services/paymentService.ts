import stripe from '../config/payment';
import env from '../config/environment';
import { Booking, AffiliateCode, Commission, User } from '../models';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

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

/**
 * Create a Stripe payment intent for deposit
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> => {
  const { bookingId, amount, currency = 'aed', metadata = {} } = params;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents/fils
      currency: currency.toLowerCase(),
      metadata: {
        bookingId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment creation failed';
    logger.error(`Failed to create payment intent: ${message}`);
    throw new AppError('Failed to create payment. Please try again.', 500);
  }
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

    const refund = await stripe.refunds.create({
      payment_intent: booking.depositPayment.transactionId,
      reason: 'requested_by_customer',
      metadata: {
        bookingId: bookingId.toString(),
        reason: reason || 'Booking cancelled',
      },
    });

    if (refund.status === 'succeeded') {
      booking.depositPayment.paymentStatus = 'refunded';
      booking.status = 'cancelled';
      await booking.save();

      logger.info(`Refund processed for booking ${booking.bookingReference}`);
      return true;
    }

    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund processing failed';
    logger.error(`Failed to process refund: ${message}`);
    throw new AppError('Failed to process refund. Please contact support.', 500);
  }
};

/**
 * Verify Stripe webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): boolean => {
  try {
    stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    return true;
  } catch {
    return false;
  }
};

