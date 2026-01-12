import api from './axios';

export interface AffiliateCode {
  code: string;
  commissionRate: number;
  usageCount: number;
  totalEarnings: number;
  isActive: boolean;
}

export interface Commission {
  _id: string;
  affiliateCode: string;
  bookingAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

export interface AffiliateDashboard {
  stats: {
    totalBookings: number;
    totalEarnings: number;
    pendingEarnings: number;
    approvedEarnings?: number;
    paidEarnings: number;
  };
  codes: AffiliateCode[];
  recentBookings: any[];
}

export const affiliatesApi = {
  register: async (): Promise<{ affiliateCode: string; commissionRate: number }> => {
    const response = await api.post('/affiliates/register');
    return response.data.data;
  },

  getDashboard: async (): Promise<AffiliateDashboard> => {
    const response = await api.get('/affiliates/dashboard');
    return response.data.data;
  },

  getMyCodes: async (): Promise<AffiliateCode[]> => {
    const response = await api.get('/affiliates/my-codes');
    return response.data.data;
  },

  generateCode: async (prefix?: string): Promise<{ code: string; commissionRate: number }> => {
    const response = await api.post('/affiliates/generate-code', { prefix });
    return response.data.data;
  },

  validateCode: async (code: string): Promise<{ code: string; affiliateName: string; isValid: boolean; canUseForReferral?: boolean; discountAmount?: number }> => {
    const response = await api.get(`/affiliates/validate/${code}`);
    return response.data.data;
  },

  getBookings: async (page = 1, limit = 10): Promise<any> => {
    const response = await api.get(`/affiliates/bookings?page=${page}&limit=${limit}`);
    return response.data;
  },

  getReferralBookings: async (page = 1, limit = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/affiliates/referral-bookings?${params.toString()}`);
    return response.data;
  },

  getCommissions: async (page = 1, limit = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/affiliates/commissions?${params.toString()}`);
    return response.data;
  },

  // User referral endpoints (for regular users)
  getMyReferral: async (): Promise<{
    code: string;
    discountPercentage: number;
    stats: {
      totalReferrals: number;
      totalEarnings: number;
      pendingEarnings: number;
      paidEarnings: number;
    };
  }> => {
    const response = await api.get('/affiliates/my-referral');
    return response.data.data;
  },

  getMyReferrals: async (page = 1, limit = 10): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/affiliates/my-referrals?${params.toString()}`);
    return response.data;
  },

  getMyReferralCommissions: async (page = 1, limit = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/affiliates/my-referral-commissions?${params.toString()}`);
    return response.data;
  },

  // Withdrawal endpoints
  requestWithdrawal: async (data: {
    amount: number;
    currency?: string;
    paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'other';
    paymentDetails: Record<string, string>;
    commissionIds?: string[];
  }): Promise<any> => {
    const response = await api.post('/affiliates/withdrawals', data);
    return response.data.data;
  },

  getMyWithdrawals: async (page = 1, limit = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/affiliates/withdrawals?${params.toString()}`);
    return response.data;
  },
};

