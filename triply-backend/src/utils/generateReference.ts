/**
 * Generate unique booking reference
 * Format: TRP-YYYYMMDD-XXXXX (e.g., TRP-20250624-A3B5C)
 */
export const generateBookingReference = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TRP-${dateStr}-${randomPart}`;
};

/**
 * Generate unique affiliate code
 * Format: AFFILIATE-XXXXX (e.g., AFF-A3B5C)
 */
export const generateAffiliateCode = (prefix?: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return prefix ? `${prefix.toUpperCase()}-${randomPart}` : `AFF-${randomPart}`;
};

/**
 * Generate unique transaction reference
 */
export const generateTransactionReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${randomPart}`;
};

