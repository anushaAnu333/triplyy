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

export const paymentsApi = {
  confirm: async (data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/confirm', data);
    return response.data.data;
  },

  simulate: async (data: ConfirmPaymentData & { success?: boolean }): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/simulate', data);
    return response.data.data;
  },

  // Activity booking payments
  createActivityBookingIntent: async (bookingId: string): Promise<CreatePaymentIntentResponse> => {
    const response = await api.post('/payments/activity-booking/create-intent', { bookingId });
    return response.data.data;
  },

  confirmActivityBookingPayment: async (data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> => {
    const response = await api.post('/payments/activity-booking/confirm', data);
    return response.data.data;
  },
};

