import api from './axios';

export interface ConfirmPaymentData {
  paymentIntentId: string;
  bookingId: string;
}

export interface ConfirmPaymentResponse {
  bookingReference: string;
  status: string;
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
};

