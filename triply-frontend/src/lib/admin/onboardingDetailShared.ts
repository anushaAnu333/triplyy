/** Shared helpers for admin merchant & referral partner onboarding detail views */

export type AdminOnboardingLikeStatus = 'pending' | 'reapplied' | 'approved' | 'rejected';

export function getPreviousApplicationId(
  prev: string | { _id: string } | null | undefined
): string | null {
  if (!prev) return null;
  if (typeof prev === 'string') return prev;
  if (typeof prev === 'object' && '_id' in prev && typeof prev._id === 'string') return prev._id;
  return null;
}

export function formatDetailDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return s;
  }
}

export function toLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function renderUnknown(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item);
        }
        return JSON.stringify(item);
      })
      .join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '—';
}

export function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
}

export function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf');
}

/** Stored path may be string or string[] (first wins for preview) */
export function normalizeStoredDocumentPath(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') return raw[0];
  return '';
}

export const KNOWN_BUSINESS_INFO_KEYS = new Set([
  'businessName',
  'contactPerson',
  'designation',
  'phone',
  'emirate',
  'website',
  'bankName',
  'accountHolderName',
  'accountNumber',
  'iban',
  'vatTrn',
  'currency',
  'email',
]);
