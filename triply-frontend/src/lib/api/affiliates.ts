import api from './axios';
import type { BusinessType, BusinessInfo } from '@/lib/merchant-onboarding/types';

export interface ReferredSignupUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode?: string;
  createdAt: string;
  hasBooking: boolean;
  totalEarnings: number;
  commissionCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Snippet attached to referral booking rows from GET /affiliates/referral-bookings */
export interface ReferralCommissionSnippet {
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'paid';
  /** API may send commissionBasisAmount (from Commission.bookingAmount) */
  commissionBasisAmount?: number;
  bookingAmount?: number;
  affiliateCode?: string;
}

/** One booking row from GET /affiliates/referral-bookings */
export interface ReferralBookingRow {
  _id: string;
  bookingReference: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  numberOfTravellers?: number;
  travelDates?: {
    startDate?: string;
    endDate?: string;
    isFlexible?: boolean;
  };
  specialRequests?: string;
  rejectionReason?: string;
  affiliateCode?: string;
  calendarUnlockedUntil?: string;
  depositPayment?: {
    amount: number;
    currency?: string;
    paymentStatus?: string;
    transactionId?: string;
    paidAt?: string;
  };
  destinationId?: { name?: string; thumbnailImage?: string };
  userId?:
    | string
    | {
        firstName?: string;
        lastName?: string;
        email?: string;
        referralCode?: string;
      };
  referralCommission: ReferralCommissionSnippet | null;
}

export interface ReferralBookingsListResponse {
  success: boolean;
  message: string;
  data: ReferralBookingRow[];
  meta: PaginatedResponse<ReferralBookingRow>['meta'];
}

export const REFERRAL_PARTNER_TERMS_VERSION = '2026-03';

export interface AffiliateCode {
  code: string;
  commissionRate: number;
  /** Bookings that attached this code at checkout */
  usageCount: number;
  /** Users who registered with this code (referredBy you + this code) */
  signupCount: number;
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
    /** People who signed up with your referral link */
    totalReferredUsers: number;
    totalEarnings: number;
    pendingEarnings: number;
    approvedEarnings: number;
    paidEarnings: number;
  };
  codes: AffiliateCode[];
  recentBookings: any[];
}

export const affiliatesApi = {
  getReferralPartnerTerms: async (): Promise<{ version: string; content: string }> => {
    const response = await api.get('/affiliates/terms');
    return response.data.data;
  },

  acceptReferralPartnerTerms: async (
    version = REFERRAL_PARTNER_TERMS_VERSION
  ): Promise<{ referralPartnerTermsAcceptedAt?: string; referralPartnerTermsVersion?: string }> => {
    const response = await api.post('/affiliates/terms/accept', { version });
    return response.data.data ?? {};
  },

  getReferralPartnerOnboardingStatus: async (): Promise<{
    status: string | null;
    applicationId: string | null;
  }> => {
    const response = await api.get('/affiliates/onboarding/status');
    return response.data.data ?? { status: null, applicationId: null };
  },

  submitReferralPartnerOnboarding: async (payload: {
    businessType: BusinessType;
    categories: string[];
    businessInfo: BusinessInfo;
    documents: Record<string, File>;
  }): Promise<{ applicationId?: string; resubmitted?: boolean }> => {
    const formData = new FormData();
    formData.append('businessType', payload.businessType);
    formData.append('categories', JSON.stringify(payload.categories));
    formData.append('businessInfo', JSON.stringify(payload.businessInfo));
    Object.entries(payload.documents).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
    const response = await api.post('/affiliates/onboarding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? response.data;
  },

  /** @deprecated Use onboarding flow + admin approval */
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

  getReferralBookings: async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<ReferralBookingsListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get<ReferralBookingsListResponse>(
      `/affiliates/referral-bookings?${params.toString()}`
    );
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

  getMyReferrals: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ReferredSignupUser>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/affiliates/my-referrals?${params.toString()}`);
    return {
      data: response.data.data ?? [],
      meta: response.data.meta ?? { page: 1, limit, total: 0, totalPages: 0 },
    };
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

