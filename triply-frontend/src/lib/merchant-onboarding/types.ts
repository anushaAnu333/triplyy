/**
 * Merchant onboarding state and payload types
 */

export type BusinessType = 'uae-company' | 'freelancer' | 'international';

export interface DocumentRequirement {
  id: string;
  label: string;
  required: boolean;
}

export interface BusinessInfo {
  businessName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  emirate: string;
  website?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  vatTrn?: string;
  currency: string;
}

export interface ServicePointGroup {
  text: string;
  subPoints: string[];
}

export interface ServiceItem {
  id: string;
  title: string;
  price: string;
  duration: string;
  groupSize: string;
  languages: string;
  description: string;
  pointsHeading: string;
  pointGroups: ServicePointGroup[];
  includes: string[];
  excludes: string[];
  images: File[];
}

export interface DocumentUpload {
  docId: string;
  file: File | null;
  uploaded: boolean;
}

export interface OnboardingState {
  step: number;
  businessType: BusinessType | null;
  categories: string[];
  businessInfo: Partial<BusinessInfo>;
  documents: Record<string, { file: File | null; uploaded: boolean }>;
  services: ServiceItem[];
}

export interface OnboardingPayload {
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
    pointGroups?: ServicePointGroup[];
    includes: string;
    excludes: string;
    images: File[];
  }>;
}
