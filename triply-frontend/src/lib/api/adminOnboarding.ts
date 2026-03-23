import api from './axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

/** URL for an onboarding document (use with api.get(..., { responseType: 'blob' }) to fetch with auth) */
export function getOnboardingDocumentUrl(applicationId: string, docKey: string): string {
  return `${API_BASE}/admin/onboarding/${applicationId}/documents/${encodeURIComponent(docKey)}`;
}

export interface MerchantOnboardingApplication {
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
  documentPaths: Record<string, string>;
  services: Array<{
    title: string;
    price: number;
    duration?: string;
    groupSize?: number;
    languages?: string;
    description: string;
    includes?: string;
    excludes?: string;
  }>;
  status: OnboardingStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingListResponse {
  data: MerchantOnboardingApplication[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminOnboardingApi = {
  getList: async (
    status?: OnboardingStatus,
    page = 1,
    limit = 10
  ): Promise<OnboardingListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/admin/onboarding?${params.toString()}`);
    return {
      data: response.data.data ?? [],
      meta: response.data.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  getById: async (id: string): Promise<MerchantOnboardingApplication> => {
    const response = await api.get(`/admin/onboarding/${id}`);
    return response.data.data;
  },

  approve: async (id: string): Promise<void> => {
    await api.put(`/admin/onboarding/${id}/approve`);
  },

  reject: async (id: string, rejectionReason?: string): Promise<void> => {
    await api.put(`/admin/onboarding/${id}/reject`, { rejectionReason });
  },
};
