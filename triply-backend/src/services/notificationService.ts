import { ActivityBooking, Booking, PackageBooking, User } from '../models';
import {
  sendDepositConfirmation,
  sendPaymentInvoice,
  sendBookingConfirmation,
  sendBookingRejection,
  sendDateSelectionConfirmation,
  sendActivityApprovedPaymentPrompt,
} from './emailService';
import logger from '../utils/logger';

/**
 * Send notification for deposit payment
 */
export const notifyDepositPaid = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId).populate('destinationId');
    if (!booking) {
      logger.error(`Booking not found for deposit notification: ${bookingId}`);
      return;
    }

    const destination = booking.destinationId as unknown as { name: string };
    await sendDepositConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      booking.depositPayment.amount,
      destination.name
    );
    await sendPaymentInvoice({
      userId: booking.userId.toString(),
      bookingReference: booking.bookingReference,
      destinationName: destination.name,
      numberOfTravellers: booking.numberOfTravellers,
      amount: booking.depositPayment.amount,
      currency: booking.depositPayment.currency || 'AED',
      transactionId: booking.depositPayment.transactionId,
      paidAt: booking.depositPayment.paidAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send deposit notification: ${message}`);
  }
};

/**
 * Deposit paid for a promotional package booking (separate from destination Booking)
 */
export const notifyPackageDepositPaid = async (packageBookingId: string): Promise<void> => {
  try {
    const booking = await PackageBooking.findById(packageBookingId).populate('packageId');
    if (!booking) {
      logger.error(`Package booking not found for deposit notification: ${packageBookingId}`);
      return;
    }

    const pkg = booking.packageId as unknown as { name: string };
    await sendDepositConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      booking.depositPayment.amount,
      pkg.name
    );
    await sendPaymentInvoice({
      userId: booking.userId.toString(),
      bookingReference: booking.bookingReference,
      destinationName: pkg.name,
      numberOfTravellers: booking.numberOfTravellers,
      amount: booking.depositPayment.amount,
      currency: booking.depositPayment.currency || 'AED',
      transactionId: booking.depositPayment.transactionId,
      paidAt: booking.depositPayment.paidAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send package deposit notification: ${message}`);
  }
};

/**
 * Send notification for booking confirmation
 */
export const notifyBookingConfirmed = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId).populate('destinationId');
    if (!booking) {
      logger.error(`Booking not found for confirmation notification: ${bookingId}`);
      return;
    }

    if (!booking.travelDates.startDate || !booking.travelDates.endDate) {
      logger.error(`Travel dates not set for booking: ${bookingId}`);
      return;
    }

    const destination = booking.destinationId as unknown as { name: string };
    await sendBookingConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      destination.name,
      booking.travelDates.startDate,
      booking.travelDates.endDate
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send confirmation notification: ${message}`);
  }
};

/**
 * Send notification for booking rejection
 */
export const notifyBookingRejected = async (
  bookingId: string,
  rejectionReason: string
): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      logger.error(`Booking not found for rejection notification: ${bookingId}`);
      return;
    }

    await sendBookingRejection(
      booking.userId.toString(),
      booking.bookingReference,
      rejectionReason
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send rejection notification: ${message}`);
  }
};

/**
 * Notify admin of new date selection
 */
export const notifyAdminDatesSelected = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'firstName lastName email')
      .populate('destinationId');

    if (!booking) {
      logger.error(`Booking not found for admin notification: ${bookingId}`);
      return;
    }

    // Get all admin users
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      // In production, send actual email to admin
      logger.info(
        `Notifying admin ${admin.email} about date selection for booking ${booking.bookingReference}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to notify admin: ${message}`);
  }
};

/**
 * Notify user of date selection confirmation
 */
export const notifyUserDatesSelected = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId).populate('destinationId');
    if (!booking) {
      logger.error(`Booking not found for user date selection notification: ${bookingId}`);
      return;
    }    if (!booking.travelDates.startDate || !booking.travelDates.endDate) {
      logger.error(`Travel dates not set for booking: ${bookingId}`);
      return;
    }    const destination = booking.destinationId as unknown as { name: string };
    await sendDateSelectionConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      destination.name,
      booking.travelDates.startDate,
      booking.travelDates.endDate
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send date selection confirmation to user: ${message}`);
  }
};

/**
 * When an activity is approved, prompt users who already created a booking
 * (status=pending_payment) to complete payment to book the seat.
 */
export const notifyActivityApprovedPaymentPrompt = async (
  activityId: string
): Promise<void> => {
  try {
    const bookings = await ActivityBooking.find({
      activityId,
      status: 'pending_payment',
    })
      .populate('userId', 'email firstName lastName')
      .populate('activityId', 'title');

    if (!bookings.length) return;

    for (const booking of bookings) {
      const user = booking.userId as any;
      const activity = booking.activityId as any;
      if (!user?.email || !activity?.title) continue;

      await sendActivityApprovedPaymentPrompt(
        user._id.toString(),
        booking._id.toString(),
        booking.bookingReference,
        activity.title,
        booking.selectedDate
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send activity approved payment prompt: ${message}`);
  }
};