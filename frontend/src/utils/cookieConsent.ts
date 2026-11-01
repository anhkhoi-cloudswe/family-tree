/**
 * Cookie Consent & Privacy Compliance Helper
 * Tuân thủ Nghị định 13/2023/NĐ-CP (Việt Nam), GDPR (EU), CCPA (California).
 */

export type ConsentStatus = 'ACCEPTED' | 'REJECTED' | 'ESSENTIAL_ONLY' | null;

export interface CookiePreferences {
  essential: boolean; // Luôn luôn true (phiên đăng nhập, token bảo mật, CSRF)
  analytics: boolean; // Google Analytics / Firebase Analytics
  marketing: boolean; // Pixel / Facebook / Tiếp thị lại
  consentedAt?: string;
  region?: 'VN' | 'EU' | 'US' | 'GLOBAL';
}

const COOKIE_CONSENT_KEY = 'famlykin_cookie_consent_v1';
const COOKIE_PREFERENCES_KEY = 'famlykin_cookie_preferences_v1';

/**
 * Phát hiện khu vực pháp lý dựa trên TimeZone của thiết bị người dùng
 */
export function detectUserRegion(): 'VN' | 'EU' | 'US' | 'GLOBAL' {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Ho_Chi_Minh') || tz.includes('Saigon') || tz.includes('Bangkok') || tz.includes('Hanoi')) {
      return 'VN'; // Nghị định 13/2023/NĐ-CP
    }
    if (tz.startsWith('Europe/')) {
      return 'EU'; // GDPR
    }
    if (tz.includes('Los_Angeles') || tz.includes('California') || tz.startsWith('US/') || tz.startsWith('America/')) {
      return 'US'; // CCPA
    }
  } catch (e) {
    console.warn('[Privacy] Không thể phát hiện Timezone:', e);
  }
  return 'GLOBAL';
}

/**
 * Lấy trạng thái đồng ý Cookie hiện tại
 */
export function getStoredCookieConsent(): ConsentStatus {
  try {
    const val = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (val === 'ACCEPTED' || val === 'REJECTED' || val === 'ESSENTIAL_ONLY') {
      return val;
    }
  } catch (e) {
    console.warn('[Privacy] Lỗi đọc consent:', e);
  }
  return null;
}

/**
 * Lấy chi tiết cài đặt tùy chọn Cookie
 */
export function getStoredCookiePreferences(): CookiePreferences {
  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Privacy] Lỗi đọc preferences:', e);
  }

  return {
    essential: true,
    analytics: false,
    marketing: false,
    region: detectUserRegion(),
  };
}

/**
 * Lưu trạng thái đồng ý Cookie và kích hoạt hoặc chặn script theo dõi
 */
export function saveCookieConsent(
  status: 'ACCEPTED' | 'REJECTED' | 'ESSENTIAL_ONLY',
  customPrefs?: Partial<CookiePreferences>
): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);

    const prefs: CookiePreferences = {
      essential: true,
      analytics: status === 'ACCEPTED' || !!customPrefs?.analytics,
      marketing: status === 'ACCEPTED' || !!customPrefs?.marketing,
      consentedAt: new Date().toISOString(),
      region: detectUserRegion(),
    };

    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));

    // Áp dụng quyết định chặn hoặc nạp tracking
    applyTrackingConsent(prefs);
  } catch (e) {
    console.warn('[Privacy] Lỗi lưu cookie consent:', e);
  }
}

/**
 * Chặn chủ động hoặc nạp script Google Analytics / Tracking Pixel
 * CHỈ NẠP KHI NGƯỜI DÙNG ĐÃ ĐỒNG Ý
 */
export function applyTrackingConsent(prefs?: CookiePreferences): void {
  const currentPrefs = prefs || getStoredCookiePreferences();
  const consent = getStoredCookieConsent();

  // Nếu người dùng chưa đồng ý hoặc từ chối, chặn hoàn toàn
  if (!consent || consent === 'REJECTED' || consent === 'ESSENTIAL_ONLY' || !currentPrefs.analytics) {
    // Vô hiệu hóa Google Analytics nếu đã lỡ nạp
    if (typeof window !== 'undefined') {
      (window as any)['ga-disable-GA_MEASUREMENT_ID'] = true;
      (window as any)['famlykin_tracking_enabled'] = false;
      console.log('[Privacy] Chặn toàn bộ tracking cookies tuân thủ Nghị định 13/GDPR/CCPA');
    }
    return;
  }

  // Khi đã được người dùng đồng ý:
  if (typeof window !== 'undefined') {
    (window as any)['ga-disable-GA_MEASUREMENT_ID'] = false;
    (window as any)['famlykin_tracking_enabled'] = true;
    console.log('[Privacy] Người dùng đã cấp phép: Kích hoạt cookie phân tích');
  }
}
