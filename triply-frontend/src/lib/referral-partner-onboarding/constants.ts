import type { DocumentRequirement } from '@/lib/merchant-onboarding/types';

/** Categories referral partners can promote (referral flow only). */
export const REFERRAL_PROMOTION_CATEGORIES = [
  'Holiday packages',
  'Destinations',
  'Activities & experiences',
  'Hotels & stays',
  'Other',
] as const;

export type ReferralPartnerProfileType = 'freelancer' | 'international';

export const REFERRAL_PROFILE_TYPES: { type: ReferralPartnerProfileType; label: string }[] = [
  { type: 'freelancer', label: 'UAE Freelancer' },
  { type: 'international', label: 'International' },
];

/** Document list for referral partner onboarding (separate from merchant onboarding). */
export const REFERRAL_DOCUMENT_REQUIREMENTS: Record<
  ReferralPartnerProfileType,
  DocumentRequirement[]
> = {
  freelancer: [
    { id: 'doc-eid', label: 'Emirates ID', required: true },
    {
      id: 'doc-proof',
      label: 'Proof of address or bank statement',
      required: true,
    },
  ],
  international: [
    { id: 'doc-pass', label: 'Passport (valid copy)', required: true },
    {
      id: 'doc-proof',
      label: 'Proof of address or bank statement',
      required: true,
    },
  ],
};
