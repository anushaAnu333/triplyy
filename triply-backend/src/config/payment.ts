import Stripe from 'stripe';
import env from './environment';

/**
 * Stripe payment gateway configuration
 * Used for processing AED 199 deposit payments
 */
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export default stripe;

