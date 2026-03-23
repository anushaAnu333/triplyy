import type { DocumentRequirement } from './types';

export const SERVICE_CATEGORIES = [
  'Desert Safari & Tours',
  'Boat Trips & Water Sports',
  'Hotels & Accommodation',
  'Umrah / Hajj Packages',
  'Airport Transfers',
  'Cultural Experiences',
  'Adventure Activities',
  'Other',
] as const;

export const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
  'Outside UAE',
] as const;

export const CURRENCIES = ['AED', 'USD', 'GBP', 'EUR', 'INR'] as const;

export const DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirement[]> = {
  'uae-company': [
    { id: 'doc-trade', label: 'UAE Trade License (valid copy)', required: true },
    { id: 'doc-eid', label: 'Owner / Manager Emirates ID', required: true },
    { id: 'doc-vat', label: 'VAT / TRN Certificate (if registered)', required: false },
    { id: 'doc-ins', label: 'Public Liability Insurance (recommended)', required: false },
  ],
  freelancer: [
    { id: 'doc-fp', label: 'UAE Freelance Permit', required: true },
    { id: 'doc-eid', label: 'Emirates ID', required: true },
    { id: 'doc-port', label: 'Portfolio or sample service photos', required: false },
  ],
  international: [
    { id: 'doc-pass', label: 'Passport (valid, all pages)', required: true },
    { id: 'doc-breg', label: 'Home Country Business Registration', required: true },
    { id: 'doc-addr', label: 'Proof of Business Address', required: false },
    { id: 'doc-ins', label: 'Public Liability Insurance (recommended)', required: false },
  ],
};

export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png';
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/jpg,image/png';
export const MAX_FILE_SIZE_MB = 10;
export const MIN_SERVICE_IMAGES = 1;
export const RECOMMENDED_SERVICE_IMAGES = 3;

export const ONBOARDING_STORAGE_KEY = 'triply_merchant_onboarding';
