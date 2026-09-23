/**
 * Referral Cookie & Storage Utility for Women Business Partner Program
 * Ensures referral codes persist across navigation and auto-apply 4% discounts.
 * 15-minute expiration policy (900 seconds).
 */

const COOKIE_NAME = 'ajw_referral_partner';
const COOKIE_NAME_PARTNER = 'ajw_referral_partner_name';
const COOKIE_NAME_EXP = 'ajw_referral_partner_exp';
const EXPIRY_SECONDS = 900; // 15 minutes

export interface ReferralData {
  code: string;
  partnerName?: string;
  expiresAt: number;
}

/**
 * Saves referral code and optional partner name to Cookie (15 min) and localStorage (15 min)
 */
export function setReferralCookie(code: string, partnerName?: string): void {
  if (!code || typeof window === 'undefined') return;

  const cleanCode = code.trim().toUpperCase();
  const expiresAt = Date.now() + EXPIRY_SECONDS * 1000;
  const cookieOptions = `; max-age=${EXPIRY_SECONDS}; path=/; SameSite=Lax`;

  try {
    // 1. Set 15-minute document cookies
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(cleanCode)}${cookieOptions}`;
    document.cookie = `${COOKIE_NAME_EXP}=${expiresAt}${cookieOptions}`;
    if (partnerName) {
      document.cookie = `${COOKIE_NAME_PARTNER}=${encodeURIComponent(partnerName)}${cookieOptions}`;
    }

    // 2. Set localStorage with explicit expiry timestamp
    localStorage.setItem(COOKIE_NAME, cleanCode);
    localStorage.setItem(COOKIE_NAME_EXP, String(expiresAt));
    if (partnerName) {
      localStorage.setItem(COOKIE_NAME_PARTNER, partnerName);
    }
  } catch (e) {
    console.warn('Failed to save referral cookie:', e);
  }
}

/**
 * Retrieves the active non-expired referral partner code from cookies or localStorage
 */
export function getReferralCookie(): ReferralData | null {
  if (typeof window === 'undefined') return null;

  try {
    let code: string | null = null;
    let partnerName: string | undefined = undefined;
    let expiresAt: number = 0;

    // 1. Try reading document.cookie first
    if (typeof document !== 'undefined' && document.cookie) {
      const matchCode = document.cookie.match(/(?:^|;\s*)ajw_referral_partner=([^;]+)/);
      const matchName = document.cookie.match(/(?:^|;\s*)ajw_referral_partner_name=([^;]+)/);
      const matchExp = document.cookie.match(/(?:^|;\s*)ajw_referral_partner_exp=([^;]+)/);

      if (matchCode && matchCode[1]) {
        code = decodeURIComponent(matchCode[1]).trim().toUpperCase();
      }
      if (matchName && matchName[1]) {
        partnerName = decodeURIComponent(matchName[1]).trim();
      }
      if (matchExp && matchExp[1]) {
        expiresAt = Number(matchExp[1]);
      }
    }

    // 2. Check localStorage fallback if cookie was empty or missing
    if (!code) {
      const storedCode = localStorage.getItem(COOKIE_NAME);
      const storedExp = localStorage.getItem(COOKIE_NAME_EXP);
      const storedName = localStorage.getItem(COOKIE_NAME_PARTNER);

      if (storedCode && storedExp) {
        const expTime = Number(storedExp);
        if (Date.now() <= expTime) {
          code = storedCode.trim().toUpperCase();
          expiresAt = expTime;
          if (storedName) partnerName = storedName.trim();
        } else {
          // Expired in localStorage, clean up
          clearReferralCookie();
          return null;
        }
      }
    }

    // Check if expiry timestamp has passed
    if (code) {
      if (expiresAt > 0 && Date.now() > expiresAt) {
        clearReferralCookie();
        return null;
      }
      return {
        code,
        partnerName,
        expiresAt: expiresAt || Date.now() + EXPIRY_SECONDS * 1000
      };
    }
  } catch (e) {
    console.warn('Error reading referral cookie:', e);
  }

  return null;
}

/**
 * Clears referral cookie and localStorage entries
 */
export function clearReferralCookie(): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
      document.cookie = `${COOKIE_NAME_PARTNER}=; max-age=0; path=/; SameSite=Lax`;
      document.cookie = `${COOKIE_NAME_EXP}=; max-age=0; path=/; SameSite=Lax`;
    }
    localStorage.removeItem(COOKIE_NAME);
    localStorage.removeItem(COOKIE_NAME_PARTNER);
    localStorage.removeItem(COOKIE_NAME_EXP);
  } catch (e) {
    console.warn('Error clearing referral cookie:', e);
  }
}
