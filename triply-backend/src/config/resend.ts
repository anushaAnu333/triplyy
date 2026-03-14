import { Resend } from 'resend';
import env from './environment';

/**
 * Resend client – only initialized when RESEND_API_KEY is set.
 * Use for sending transactional emails (deposit confirmation, invoice, etc.).
 * Verify your domain at https://resend.com/domains and set EMAIL_FROM to that domain in production.
 */
const resend =
  env.RESEND_API_KEY && env.RESEND_API_KEY.length > 0
    ? new Resend(env.RESEND_API_KEY)
    : null;

export { resend };
export const isResendEnabled = (): boolean => !!resend;
