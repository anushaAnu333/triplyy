import transporter from '../config/email';
import { resend, isResendEnabled } from '../config/resend';
import env from '../config/environment';
import { EmailLog, User } from '../models';
import logger from '../utils/logger';
import { EmailType } from '../models/EmailLog';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  emailType: EmailType;
}

/** Resend test sender – use only when no verified domain is set in EMAIL_FROM */
const RESEND_TEST_FROM = 'TRIPLY <onboarding@resend.dev>';

const fromAddress = (useResend: boolean): string => {
  const addr = (env.EMAIL_FROM || '').trim();
  if (useResend && (!addr || addr === 'noreply@triply.com')) {
    return RESEND_TEST_FROM;
  }
  if (addr.includes('@')) {
    return addr.includes('<') ? addr : `TRIPLY <${addr}>`;
  }
  return RESEND_TEST_FROM;
};

/**
 * Send an email via Resend (if RESEND_API_KEY is set) or SMTP, and log the result.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, html, userId, emailType } = options;

  const emailLog = new EmailLog({
    userId,
    emailType,
    recipient: to,
    subject,
    status: 'pending',
  });

  if (isResendEnabled() && resend) {
    const from = fromAddress(true);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
      logger.error(`Resend failed to send email to ${to}: ${error.message}`);
      return false;
    }

    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    await emailLog.save();
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: fromAddress(false),
      to,
      subject,
      html,
    });

    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    await emailLog.save();

    logger.info(`Email sent successfully to ${to}: ${subject}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    emailLog.status = 'failed';
    emailLog.errorMessage = errorMessage;
    await emailLog.save();

    logger.error(`Failed to send email to ${to}: ${errorMessage}`);
    return false;
  }
};

/**
 * Send deposit confirmation email
 */
export const sendDepositConfirmation = async (
  userId: string,
  bookingReference: string,
  depositAmount: number,
  destinationName: string
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for deposit confirmation: ${userId}`);
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; background-color: #f4f4f5; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .header { background: #18181b; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
        .header p { margin: 8px 0 0; font-size: 14px; color: #a1a1aa; font-weight: 400; }
        .body { padding: 32px 24px; }
        .body p { margin: 0 0 16px; }
        .body p:last-of-type { margin-bottom: 0; }
        .greeting { font-size: 16px; color: #3f3f46; }
        .lead { font-size: 17px; font-weight: 500; color: #18181b; }
        .sub { font-size: 15px; color: #52525b; margin-top: 8px; }
        .details { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e4e4e7; }
        .details table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .details td { padding: 8px 0; color: #3f3f46; }
        .details td:first-child { color: #71717a; font-weight: 500; width: 140px; }
        .details td:last-child { font-weight: 500; color: #18181b; }
        .cta-wrap { margin-top: 28px; text-align: center; }
        .cta { display: inline-block; background: #18181b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #e4e4e7; background: #fafafa; }
        .footer p { margin: 0; font-size: 13px; color: #71717a; }
        .footer a { color: #3f3f46; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>Deposit confirmed</h1>
            <p>${bookingReference}</p>
          </div>
          <div class="body">
            <p class="greeting">Hi ${user.firstName},</p>
            <p class="lead">Your spot is now secured.</p>
            <p class="sub">Your booking is locked in for 1 year — pick your travel dates whenever you're ready.</p>
            <div class="details">
              <table>
                <tr><td>Booking reference</td><td>${bookingReference}</td></tr>
                <tr><td>Destination</td><td>${destinationName}</td></tr>
                <tr><td>Deposit paid</td><td>AED ${depositAmount}</td></tr>
              </table>
            </div>
            <div class="cta-wrap">
              <a href="${env.FRONTEND_URL}/bookings" class="cta">Select your dates</a>
            </div>
          </div>
          <div class="footer">
            <p>TRIPLY · Your travel partner</p>
            <p><a href="mailto:hello@triplysquads.com">Contact support</a> if you have any questions.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Deposit Confirmed - ${bookingReference}`,
    html,
    userId,
    emailType: 'deposit_confirmation',
  });
};

/**
 * Send payment invoice/receipt to customer after successful payment
 */
export const sendPaymentInvoice = async (params: {
  userId: string;
  bookingReference: string;
  destinationName: string;
  numberOfTravellers: number;
  amount: number;
  currency: string;
  transactionId?: string;
  paidAt?: Date;
}): Promise<boolean> => {
  const {
    userId,
    bookingReference,
    destinationName,
    numberOfTravellers,
    amount,
    currency,
    transactionId,
    paidAt,
  } = params;

  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for payment invoice: ${userId}`);
    return false;
  }

  const paymentDate = paidAt
    ? new Date(paidAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
  const currencyLabel = (currency || 'AED').toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a; background: #f4f4f5; -webkit-text-size-adjust: 100%; }
        .wrapper { max-width: 100%; padding: 16px; box-sizing: border-box; }
        .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); max-width: 560px; margin: 0 auto; }
        .header { background: #1a1a2e; color: #fff; padding: 24px 20px; text-align: center; }
        .invoice-title { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
        .meta { font-size: 13px; color: rgba(255,255,255,0.85); margin: 0; }
        .content { padding: 24px 20px; }
        .content p { margin: 0 0 12px; }
        .content .lead { margin-bottom: 20px; }
        .row { padding: 12px 0; border-bottom: 1px solid #eee; }
        .row:last-child { border-bottom: none; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; color: #71717a; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 500; color: #18181b; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
        .amounts { margin: 20px 0; background: #f4f4f5; border-radius: 8px; padding: 16px; border: 1px solid #e4e4e7; }
        .amounts table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .amounts td { padding: 8px 0; vertical-align: top; }
        .amounts td:last-child { text-align: right; font-weight: 600; color: #18181b; }
        .amounts tr.total td { padding-top: 12px; border-top: 1px solid #e4e4e7; font-size: 16px; font-weight: 700; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #e4e4e7; background: #fafafa; font-size: 13px; color: #71717a; }
        .footer p { margin: 0 0 4px; }
        .footer a { color: #3f3f46; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1 class="invoice-title">Payment Invoice</h1>
            <p class="meta">${bookingReference}</p>
          </div>
          <div class="content">
            <p>Dear ${user.firstName},</p>
            <p class="lead">Thank you for your payment! Here's your invoice for your records.</p>

            <div class="row"><div class="label">Booking reference</div><div class="value">${bookingReference}</div></div>
            <div class="row"><div class="label">Payment date</div><div class="value">${paymentDate}</div></div>
            <div class="row"><div class="label">Destination</div><div class="value">${destinationName}</div></div>
            <div class="row"><div class="label">Number of travellers</div><div class="value">${numberOfTravellers}</div></div>
            ${transactionId ? `<div class="row"><div class="label">Transaction ID</div><div class="value">${transactionId}</div></div>` : ''}

            <div class="amounts">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="color:#3f3f46">Trip deposit (${numberOfTravellers} ${numberOfTravellers === 1 ? 'traveller' : 'travellers'})</td><td>${currencyLabel} ${amount.toFixed(2)}</td></tr>
                <tr class="total"><td>Total paid</td><td>${currencyLabel} ${amount.toFixed(2)}</td></tr>
              </table>
            </div>

            <p>You're all set! Your booking is valid for 1 year — choose your travel dates anytime.</p>

            <div class="footer">
              <p>TR✨PLY – Travel. Connect. Repeat.</p>
              <p>Keep this for your records. Questions? <a href="mailto:hello@triplysquads.com">Reach us</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Payment invoice - ${bookingReference} | TRIPLY`,
    html,
    userId,
    emailType: 'payment_invoice',
  });
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (
  userId: string,
  bookingReference: string,
  destinationName: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for booking confirmation: ${userId}`);
    return false;
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; }
        .dates { display: flex; justify-content: space-between; margin: 10px 0; }
        .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Great news! Your booking has been confirmed.</p>
          
          <div class="highlight">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Check-in:</strong> ${formatDate(startDate)}</p>
            <p><strong>Check-out:</strong> ${formatDate(endDate)}</p>
          </div>
          
          <p>We'll send you detailed travel information closer to your departure date.</p>
          
          <a href="${env.FRONTEND_URL}/bookings/${bookingReference}" class="button">View Booking Details</a>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Confirmed - ${bookingReference}`,
    html,
    userId,
    emailType: 'booking_confirmed',
  });
};

/**
 * Send booking rejection email
 */
export const sendBookingRejection = async (
  userId: string,
  bookingReference: string,
  rejectionReason: string
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for booking rejection: ${userId}`);
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff416c; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Update</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>We regret to inform you that your booking could not be confirmed.</p>
          
          <div class="highlight">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
          </div>
          
          <p>Your deposit will be refunded to your original payment method within 5-7 business days.</p>
          <p>You can select different dates or explore other destinations.</p>
          
          <a href="${env.FRONTEND_URL}/destinations" class="button">Explore Destinations</a>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Update - ${bookingReference}`,
    html,
    userId,
    emailType: 'booking_rejected',
  });
};

/**
 * Send email when an activity is approved while the guest has a pending payment booking.
 * This prompts the user to complete payment (to book the seat).
 */
export const sendActivityApprovedPaymentPrompt = async (
  userId: string,
  bookingId: string,
  bookingReference: string,
  activityTitle: string,
  selectedDate: Date
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for activity approval payment prompt: ${userId}`);
    return false;
  }

  const formattedSelectedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(selectedDate);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; }
        .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your activity is approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Great news! The activity you booked has been approved.</p>

          <div class="highlight">
            <p><strong>Activity:</strong> ${activityTitle}</p>
            <p><strong>Date:</strong> ${formattedSelectedDate}</p>
            <p><strong>Booking reference:</strong> ${bookingReference}</p>
          </div>

          <p>Next step: please complete your payment to book your seat.</p>
          <a href="${env.FRONTEND_URL}/bookings/${bookingId}" class="button">Pay Now & Book Seat</a>

          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `TRIPLY — Activity approved. Complete payment to book your seat`,
    html,
    userId,
    emailType: 'activity_approved_payment_prompt',
  });
};

/**
 * Send date selection confirmation to user
 */
export const sendDateSelectionConfirmation = async (
  userId: string,
  bookingReference: string,
  destinationName: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for date selection confirmation: ${userId}`);
    return false;
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
        .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Travel Dates Selected!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Great! You've selected your travel dates. We've received your request and will confirm it shortly.</p>
          
          <div class="highlight">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Check-in:</strong> ${formatDate(startDate)}</p>
            <p><strong>Check-out:</strong> ${formatDate(endDate)}</p>
          </div>
          
          <p>Our team is reviewing your booking and will send you a confirmation email once it's approved.</p>
          
          <a href="${env.FRONTEND_URL}/bookings" class="button">View Booking</a>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Travel Dates Selected - ${bookingReference}`,
    html,
    userId,
    emailType: 'dates_selected',
  });
};

/**
 * Send email verification link
 */
export const sendEmailVerification = async (
  userId: string,
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to TRIPLY!</h1>
        </div>
        <div class="content">
          <p>Dear ${firstName},</p>
          <p>Thank you for registering with TRIPLY. Please verify your email address to complete your registration.</p>
          
          <a href="${verificationUrl}" class="button">Verify Email</a>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${verificationUrl}
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This link will expire in 24 hours.
          </p>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - TRIPLY',
    html,
    userId,
    emailType: 'email_verification',
  });
};

/**
 * Send password reset link
 */
export const sendPasswordReset = async (
  userId: string,
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Dear ${firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This link will expire in 1 hour.
          </p>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - TRIPLY',
    html,
    userId,
    emailType: 'password_reset',
  });
};

/**
 * Send calendar expiry reminder email
 */
export const sendCalendarExpiryReminder = async (
  userId: string,
  bookingReference: string,
  destinationName: string,
  expiryDate: Date
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for calendar expiry reminder: ${userId}`);
    return false;
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
        .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Calendar Access Expiring Soon</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>This is a friendly reminder that your calendar access for booking travel dates is expiring soon.</p>
          
          <div class="warning">
            <p><strong>⚠️ Important:</strong> Your calendar access expires on ${formatDate(expiryDate)}</p>
            <p>You have <strong>30 days</strong> remaining to select your travel dates.</p>
          </div>
          
          <div class="highlight">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Expiry Date:</strong> ${formatDate(expiryDate)}</p>
          </div>
          
          <p>Don't miss out! Select your preferred travel dates now to secure your booking.</p>
          
          <a href="${env.FRONTEND_URL}/bookings" class="button">Select Travel Dates</a>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If you have any questions or need assistance, please contact our support team.
          </p>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `⏰ Calendar Access Expiring Soon - ${bookingReference}`,
    html,
    userId,
    emailType: 'calendar_expiring',
  });
};

/**
 * Send invitation email
 */
export const sendInvitationEmail = async (
  email: string,
  role: 'admin' | 'affiliate',
  token: string,
  invitedBy: string
): Promise<boolean> => {
  const inviter = await User.findById(invitedBy);
  const invitationUrl = `${env.FRONTEND_URL}/register?invitation=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited to Join TRIPLY!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been invited by ${inviter?.firstName || 'an administrator'} to join TRIPLY as a <strong>${role}</strong>.</p>
          
          <div class="highlight">
            <p><strong>What's next?</strong></p>
            <p>Click the button below to accept this invitation and create your account. This invitation will expire in 7 days.</p>
          </div>
          
          <a href="${invitationUrl}" class="button">Accept Invitation</a>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${invitationUrl}
          </p>
          
          <div class="footer">
            <p>TRIPLY - Your Travel Partner</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Invitation to Join TRIPLY as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    html,
    emailType: 'email_verification', // Using existing type for now
  });
};

function escapeHtmlForEmail(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Notify applicant that their merchant onboarding application was rejected.
 * They may submit a new application after addressing feedback.
 */
export const sendMerchantOnboardingRejectedEmail = async (
  userId: string,
  businessName: string,
  rejectionReason?: string
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    logger.error(`User not found for merchant onboarding rejection email: ${userId}`);
    return false;
  }

  const baseUrl = (env.FRONTEND_URL || '').replace(/\/$/, '') || 'https://triplysquads.com';
  const reapplyUrl = `${baseUrl}/become-merchant?openTerms=1`;
  const reasonSection = rejectionReason?.trim()
    ? `
          <div style="background:#fff;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #f97316;">
            <p style="margin:0;font-weight:600;">Note from our team</p>
            <p style="margin:8px 0 0;white-space:pre-wrap;color:#3f3f46;">${escapeHtmlForEmail(rejectionReason.trim())}</p>
          </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #18181b; background-color: #f4f4f5; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .header { background: #18181b; color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .content { padding: 28px 24px; }
        .btn { display: inline-block; background: #ea580c; color: #fff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
        .footer { text-align: center; margin-top: 24px; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>Merchant application update</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtmlForEmail(user.firstName)},</p>
            <p>Thank you for applying to the TRIPLY Merchant Partner Program. After review, we are unable to approve your application for <strong>${escapeHtmlForEmail(businessName)}</strong> at this time.</p>
            ${reasonSection}
            <p>You are welcome to submit a <strong>new application</strong> after updating your details or documents. Sign in, review the terms, and complete onboarding again from the link below.</p>
            <p style="margin-top:8px;">
              <a href="${reapplyUrl}" class="btn">Start merchant onboarding</a>
            </p>
            <p style="font-size:13px;color:#71717a;margin-top:20px;">If you have questions, contact hello@triplysquads.com or call +971 52 516 3595.</p>
            <div class="footer">
              <p>TRIPLY</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `TRIPLY — Merchant partner application not approved`,
    html,
    userId,
    emailType: 'merchant_onboarding_rejected',
  });
};