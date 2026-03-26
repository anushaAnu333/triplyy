/** Session flag: user has scrolled through and accepted merchant T&C this session. */
export const MERCHANT_TC_SESSION_KEY = 'triply_merchant_tc_accepted';

export function setMerchantTcAccepted(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(MERCHANT_TC_SESSION_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasMerchantTcAccepted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(MERCHANT_TC_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
