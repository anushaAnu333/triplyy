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
};

