import { Booking, User } from '../models';
import {
  sendDepositConfirmation,
  sendBookingConfirmation,
  sendBookingRejection,
  sendDateSelectionConfirmation,
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

    const destination = booking.destinationId as unknown as { name: { en: string } };
    await sendDepositConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      booking.depositPayment.amount,
      destination.name.en
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send deposit notification: ${message}`);
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

    const destination = booking.destinationId as unknown as { name: { en: string } };
    await sendBookingConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      destination.name.en,
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
    }    const destination = booking.destinationId as unknown as { name: { en: string } };
    await sendDateSelectionConfirmation(
      booking.userId.toString(),
      booking.bookingReference,
      destination.name.en,
      booking.travelDates.startDate,
      booking.travelDates.endDate
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to send date selection confirmation to user: ${message}`);
  }
};