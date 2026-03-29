import type { ReferralPartnerProfileType } from './constants';
import { REFERRAL_DOCUMENT_REQUIREMENTS } from './constants';

export function getReferralPartnerDocuments(
  profileType: ReferralPartnerProfileType | null
): Array<{ id: string; label: string; required: boolean }> {
  if (!profileType) return REFERRAL_DOCUMENT_REQUIREMENTS.freelancer;
  return REFERRAL_DOCUMENT_REQUIREMENTS[profileType];
}

export function areReferralPartnerDocumentsComplete(
  profileType: ReferralPartnerProfileType | null,
  documents: Record<string, { file: File | null; uploaded: boolean }>
): boolean {
  const requirements = getReferralPartnerDocuments(profileType);
  const required = requirements.filter((r) => r.required);
  return required.every((r) => documents[r.id]?.uploaded && documents[r.id]?.file);
}
