import api from './axios';

export interface ConfirmPaymentData {
  paymentIntentId: string;
  bookingId: string;
}

export interface ConfirmPaymentResponse {
  bookingReference: string;
  status: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  triplyCommission?: number;
  merchantAmount?: number;
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

export const paymentsApi = {
  confirm: async (data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/confirm', data);
    return response.data.data;
  },

  simulate: async (data: ConfirmPaymentData & { success?: boolean }): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/simulate', data);
    return response.data.data;
  },

  /** Create Stripe Checkout Session for deposit – returns URL to redirect user to Stripe */
  createCheckoutSession: async (bookingId: string): Promise<CreateCheckoutSessionResponse> => {
    const response = await api.post('/payments/create-checkout-session', { bookingId });
    return response.data.data;
  },

  // Activity booking payments
  createActivityBookingIntent: async (bookingId: string): Promise<CreatePaymentIntentResponse> => {
    const response = await api.post('/payments/activity-booking/create-intent', { bookingId });
    return response.data.data;
  },

  /** Create Stripe Checkout Session for activity booking */
  createActivityBookingCheckoutSession: async (bookingId: string): Promise<CreateCheckoutSessionResponse> => {
    const response = await api.post('/payments/activity-booking/create-checkout-session', { bookingId });
    return response.data.data;
  },

  confirmActivityBookingPayment: async (data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/activity-booking/confirm', data);
    return response.data.data;
  },

  /** Confirm payment from Stripe session (call on success page when webhook may not have run) */
  confirmFromSession: async (sessionId: string): Promise<{ status: string }> => {
    const response = await api.get('/payments/confirm-from-session', { params: { session_id: sessionId } });
    return response.data.data;
  },
};

