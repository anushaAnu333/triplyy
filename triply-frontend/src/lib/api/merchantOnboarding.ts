import api from './axios';
import type { BusinessType } from '@/lib/merchant-onboarding/types';
import type { BusinessInfo } from '@/lib/merchant-onboarding/types';

export interface SubmitOnboardingPayload {
  businessType: BusinessType;
  categories: string[];
  businessInfo: BusinessInfo;
  documents: Record<string, File>;
  services: Array<{
    title: string;
    price: number;
    duration: string;
    groupSize: number | null;
    languages: string;
    description: string;
    pointsHeading?: string;
    pointGroups?: Array<{ text: string; subPoints?: string[] }>;
    includes: string;
    excludes: string;
    images: File[];
  }>;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  applicationId?: string;
}

/**
 * Submit merchant onboarding application (multipart: JSON fields + files)
 */
export async function submitMerchantOnboarding(payload: SubmitOnboardingPayload): Promise<OnboardingResponse> {
  const formData = new FormData();
  formData.append('businessType', payload.businessType);
  formData.append('categories', JSON.stringify(payload.categories));
  formData.append('businessInfo', JSON.stringify(payload.businessInfo));
  formData.append(
    'services',
    JSON.stringify(
      payload.services.map((s) => ({
        title: s.title,
        price: s.price,
        duration: s.duration,
        groupSize: s.groupSize,
        languages: s.languages,
        description: s.description,
        pointsHeading: s.pointsHeading,
        pointGroups: s.pointGroups,
        includes: s.includes,
        excludes: s.excludes,
      }))
    )
  );

  Object.entries(payload.documents).forEach(([key, file]) => {
    if (file) formData.append(key, file);
  });

  payload.services.forEach((service, index) => {
    service.images.forEach((img) => {
      formData.append(`service_${index}_photos`, img);
    });
  });

  const response = await api.post('/merchant/onboarding', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data ?? response.data;
}
