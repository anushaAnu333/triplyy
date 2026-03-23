import { DOCUMENT_REQUIREMENTS } from './constants';
import type { BusinessType } from './types';

/**
 * Returns document requirements for the given business type
 */
export function getDocumentsForBusinessType(
  businessType: BusinessType | null
): Array<{ id: string; label: string; required: boolean }> {
  if (!businessType) return DOCUMENT_REQUIREMENTS['uae-company'];
  return DOCUMENT_REQUIREMENTS[businessType] ?? DOCUMENT_REQUIREMENTS['uae-company'];
}

/**
 * Checks if all required documents are uploaded
 */
export function areRequiredDocumentsUploaded(
  businessType: BusinessType | null,
  documents: Record<string, { file: File | null; uploaded: boolean }>
): boolean {
  const requirements = getDocumentsForBusinessType(businessType);
  const required = requirements.filter((r) => r.required);
  return required.every((r) => documents[r.id]?.uploaded && documents[r.id]?.file);
}
