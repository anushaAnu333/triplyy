import transporter from '../config/email';
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

/**
 * Send an email and log the result
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, html, userId, emailType } = options;

  // Create email log entry
  const emailLog = new EmailLog({
    userId,
    emailType,
    recipient: to,
    subject,
    status: 'pending',
  });

  try {
    await transporter.sendMail({
      from: `TRIPLY <${env.EMAIL_FROM}>`,
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
          <h1>Deposit Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Thank you for your deposit! Your booking is now secured.</p>
          
          <div class="highlight">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Deposit Amount:</strong> AED ${depositAmount}</p>
          </div>
          
          <p>Your calendar is now unlocked for 1 year. You can select your travel dates at any time.</p>
          
          <a href="${env.FRONTEND_URL}/bookings" class="button">Select Your Dates</a>
          
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
    subject: `Deposit Confirmed - ${bookingReference}`,
    html,
    userId,
    emailType: 'deposit_confirmation',
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