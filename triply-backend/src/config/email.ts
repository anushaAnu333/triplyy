import nodemailer from 'nodemailer';
import env from './environment';

/**
 * Email transporter configuration
 * Uses SMTP for sending transactional emails
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

export const transporter = createTransporter();

export default transporter;

