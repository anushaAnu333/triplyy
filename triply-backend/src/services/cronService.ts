import * as cron from 'node-cron';
import { ActivityBooking, Booking } from '../models';
import { sendCalendarExpiryReminder } from './emailService';
import logger from '../utils/logger';
import env from '../config/environment';

/**
 * Check for bookings with calendar expiring in 30 days and send reminders
 */
const checkCalendarExpiry = async (): Promise<void> => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Find bookings where calendarUnlockedUntil is between today and 30 days from now
    // and status is deposit_paid or dates_selected (not yet confirmed)
    const expiringBookings = await Booking.find({
      calendarUnlockedUntil: {
        $gte: today,
        $lte: thirtyDaysFromNow,
      },
      status: { $in: ['deposit_paid', 'dates_selected'] },
    })
      .populate('destinationId', 'name')
      .populate('userId', 'firstName email');

    logger.info(`Found ${expiringBookings.length} bookings with expiring calendar access`);

    for (const booking of expiringBookings) {
      // Check if we've already sent a reminder (by checking email logs)
      // For simplicity, we'll send reminder if calendar expires within 30-31 days
      const daysUntilExpiry = Math.ceil(
        (booking.calendarUnlockedUntil!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry >= 29 && daysUntilExpiry <= 31) {
        const destination = booking.destinationId as any;
        const user = booking.userId as any;

        if (destination && user && booking.calendarUnlockedUntil) {
          await sendCalendarExpiryReminder(
            user._id.toString(),
            booking.bookingReference,
            (typeof destination.name === 'string' ? destination.name : (destination.name as { en?: string })?.en) || 'Your Destination',
            booking.calendarUnlockedUntil
          );

          logger.info(
            `Sent calendar expiry reminder for booking ${booking.bookingReference} to ${user.email}`
          );
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in calendar expiry check: ${message}`);
  }
};

/**
 * Release activity booking payouts to merchants after the payout delay window.
 *
 * Business rule (MVP):
 * - Customer pays to Triply.
 * - Triply keeps commission (20%) immediately (stored as `payment.triplyCommission`).
 * - Merchant receives 80% payout after:
 *    - booking is approved/confirmed, and
 *    - selectedDate + ACTIVITY_PAYOUT_DELAY_DAYS is reached.
 */
const releaseDueActivityPayouts = async (): Promise<void> => {
  try {
    const delayDays = env.ACTIVITY_PAYOUT_DELAY_DAYS;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - delayDays);

    const dueBookings = await ActivityBooking.find({
      status: 'confirmed',
      'payment.paymentStatus': 'completed',
      'payment.merchantPayoutStatus': 'pending',
      $expr: {
        $lte: [{ $ifNull: ['$lastActivityDate', '$selectedDate'] }, cutoff],
      },
    });

    if (!dueBookings.length) return;

    for (const booking of dueBookings) {
      booking.payment.merchantPayoutStatus = 'paid';
      booking.payment.merchantPayoutDate = now;
      await booking.save();

      logger.info(
        `[PAYOUT] Activity booking payout released: bookingId=${booking._id}, reference=${booking.bookingReference}, amount=${booking.payment.merchantAmount}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in releaseDueActivityPayouts: ${message}`);
  }
};

/**
 * Initialize cron jobs
 */
export const initializeCronJobs = (): void => {
  // Run daily at 9 AM UTC
  cron.schedule('0 9 * * *', () => {
    logger.info('Running daily calendar expiry check...');
    checkCalendarExpiry();
  });

  // Run daily at 9:15 AM UTC for payouts
  cron.schedule('15 9 * * *', () => {
    logger.info('Running daily activity payout release...');
    releaseDueActivityPayouts();
  });

  logger.info('Cron jobs initialized');
};

