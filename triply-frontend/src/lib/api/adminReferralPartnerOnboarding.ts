import api from './axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type ReferralPartnerOnboardingStatus = 'pending' | 'reapplied' | 'approved' | 'rejected';

export function getReferralPartnerDocumentUrl(applicationId: string, docKey: string): string {
  return `${API_BASE}/admin/referral-partner-onboarding/${applicationId}/documents/${encodeURIComponent(docKey)}`;
}

export interface ReferralPartnerOnboardingApplication {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
  documentPaths: Record<string, string | string[]>;
  status: ReferralPartnerOnboardingStatus;
  rejectionReason?: string;
  previousApplicationId?: string | { _id: string; status: string; createdAt: string };
  createdAt: string;
  updatedAt: string;
}

export interface ReferralPartnerListResponse {
  data: ReferralPartnerOnboardingApplication[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminReferralPartnerOnboardingApi = {
  getList: async (
    status?: ReferralPartnerOnboardingStatus,
    page = 1,
    limit = 10
  ): Promise<ReferralPartnerListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/admin/referral-partner-onboarding?${params.toString()}`);
    return {
      data: response.data.data ?? [],
      meta: response.data.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  getById: async (id: string): Promise<ReferralPartnerOnboardingApplication> => {
    const response = await api.get(`/admin/referral-partner-onboarding/${id}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<void> => {
    await api.put(`/admin/referral-partner-onboarding/${id}/approve`);
  },

  reject: async (id: string, rejectionReason?: string): Promise<void> => {
    await api.put(`/admin/referral-partner-onboarding/${id}/reject`, { rejectionReason });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/referral-partner-onboarding/${id}`);
  },
};
