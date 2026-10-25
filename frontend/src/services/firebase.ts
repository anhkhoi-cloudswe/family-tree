import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  applyActionCode,
  reload,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  ActionCodeSettings,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

const env = (import.meta as any).env || {};

const cleanConfigVal = (val?: string, defaultVal: string = '') => {
  if (!val || typeof val !== 'string') return defaultVal;
  const trimmed = val.trim();
  if (trimmed.startsWith('VITE_FIREBASE') || trimmed.includes('${{') || trimmed.length < 5) {
    return defaultVal;
  }
  return trimmed;
};

const firebaseConfig = {
  apiKey: cleanConfigVal(env.VITE_FIREBASE_API_KEY, 'AIzaSyCis4Z1KoowS4WdweThx2qrR7_UEwL32Lg'),
  authDomain: cleanConfigVal(env.VITE_FIREBASE_AUTH_DOMAIN, 'fam3-fam3.firebaseapp.com'),
  projectId: cleanConfigVal(env.VITE_FIREBASE_PROJECT_ID, 'fam3-fam3'),
  storageBucket: cleanConfigVal(env.VITE_FIREBASE_STORAGE_BUCKET, 'fam3-fam3.firebasestorage.app'),
  messagingSenderId: cleanConfigVal(env.VITE_FIREBASE_MESSAGING_SENDER_ID, '637965754376'),
  appId: cleanConfigVal(env.VITE_FIREBASE_APP_ID, '1:637965754376:web:646ecb46f6551047a831bd'),
  measurementId: cleanConfigVal(env.VITE_FIREBASE_MEASUREMENT_ID, 'G-ED5GG39XGD'),
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);
// Thiết lập ngôn ngữ tiếng Việt để Firebase tự động gửi email tiếng Việt chuyên nghiệp
firebaseAuth.languageCode = 'vi';

const EMAIL_FOR_SIGN_IN_KEY = 'fam3_email_for_sign_in';

/**
 * Đăng ký tài khoản mới qua Firebase Auth và tự động gửi email xác thực kích hoạt (Hạn mức 1.000 mail/ngày)
 */
export const registerWithFirebaseAndSendVerification = async (
  email: string,
  pass: string
): Promise<{ user: User }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, pass);

  const actionCodeSettings: ActionCodeSettings = {
    url: window.location.origin,
    handleCodeInApp: true,
  };
  await sendEmailVerification(cred.user, actionCodeSettings);
  return { user: cred.user };
};

/**
 * Gửi lại email xác thực kích hoạt tài khoản
 */
export const resendFirebaseVerificationEmail = async (user?: User | null): Promise<void> => {
  const targetUser = user || firebaseAuth.currentUser;
  if (!targetUser) {
    throw new Error('Không tìm thấy phiên người dùng. Vui lòng đăng nhập để gửi lại email.');
  }
  const actionCodeSettings: ActionCodeSettings = {
    url: window.location.origin,
    handleCodeInApp: true,
  };
  await sendEmailVerification(targetUser, actionCodeSettings);
};

/**
 * Kiểm tra xem email người dùng đã được kích hoạt (verified) hay chưa
 */
export const checkEmailVerified = async (user?: User | null): Promise<boolean> => {
  const targetUser = user || firebaseAuth.currentUser;
  if (!targetUser) return false;
  await reload(targetUser);
  return targetUser.emailVerified;
};

/**
 * Đăng nhập bằng Email & Mật khẩu qua Firebase Auth
 */
export const loginWithFirebase = async (
  email: string,
  pass: string
): Promise<{ user: User; emailVerified: boolean }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
  return { user: cred.user, emailVerified: cred.user.emailVerified };
};

/**
 * Áp dụng mã kích hoạt email từ link
 */
export const applyEmailVerificationCode = async (oobCode: string): Promise<void> => {
  await applyActionCode(firebaseAuth, oobCode);
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Đăng nhập / Đăng ký nhanh bằng tài khoản Google (Google Sign-In)
 * Google tự động xác thực email (emailVerified = true), không lo quota giới hạn
 */
export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user;
};

/**
 * Gửi Email Link (Magic Link) tới hộp thư người dùng qua Firebase Authentication
 */
export const sendFirebaseMagicLink = async (email: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const targetUrl = new URL(window.location.origin);
  targetUrl.searchParams.set('email', cleanEmail);

  const actionCodeSettings: ActionCodeSettings = {
    url: targetUrl.toString(),
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(firebaseAuth, cleanEmail, actionCodeSettings);
  localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, cleanEmail);

  return {
    success: true,
    message: `Đã gửi liên kết đăng nhập tới ${cleanEmail}!`,
  };
};

/**
 * Gửi email đặt lại mật khẩu an toàn qua Firebase Authentication
 */
export const sendFirebasePasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const targetUrl = new URL(window.location.origin);
  targetUrl.searchParams.set('email', cleanEmail);

  const actionCodeSettings: ActionCodeSettings = {
    url: targetUrl.toString(),
    handleCodeInApp: true,
  };

  await sendPasswordResetEmail(firebaseAuth, cleanEmail, actionCodeSettings);

  return {
    success: true,
    message: `Đã gửi liên kết khôi phục mật khẩu tới ${cleanEmail}!`,
  };
};

/**
 * Kiểm tra xem URL hiện tại có phải là link xác thực Firebase hay không
 */
export const isFirebaseEmailLink = (): boolean => {
  return isSignInWithEmailLink(firebaseAuth, window.location.href);
};

/**
 * Trích xuất email sạch từ LocalStorage hoặc URL query params hoặc continueUrl
 */
export const getEmailFromUrlOrStorage = (): string | null => {
  const stored = localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  if (stored && stored.includes('@')) {
    return stored.toLowerCase().trim();
  }

  const pendingRaw = localStorage.getItem('famlykin_pending_signup');
  if (pendingRaw) {
    try {
      const parsed = JSON.parse(pendingRaw);
      if (parsed.email && parsed.email.includes('@')) {
        return parsed.email.toLowerCase().trim();
      }
    } catch {}
  }

  const urlParams = new URLSearchParams(window.location.search);
  let email = urlParams.get('email');

  if (!email && urlParams.get('continueUrl')) {
    try {
      const continueUrl = new URL(urlParams.get('continueUrl')!);
      email = continueUrl.searchParams.get('email');
    } catch {}
  }

  if (email) {
    let clean = email.toLowerCase().trim();
    for (let i = 0; i < 3; i++) {
      if (clean.includes('%')) {
        try {
          const decoded = decodeURIComponent(clean);
          if (decoded === clean) break;
          clean = decoded;
        } catch {
          break;
        }
      } else {
        break;
      }
    }
    if (clean.includes('@')) {
      return clean;
    }
  }

  return null;
};

/**
 * Hoàn tất xác thực đăng nhập qua Firebase Email Link
 */
export const completeFirebaseSignIn = async (email: string): Promise<string> => {
  const result = await signInWithEmailLink(firebaseAuth, email, window.location.href);
  localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  return result.user?.email || email;
};

export type { ConfirmationResult };

/**
 * Kiểm tra và chuẩn hóa số điện thoại đầu số nhà mạng Việt Nam (10 chữ số)
 */
export const validateVietnamesePhone = (phone: string): {
  isValid: boolean;
  normalized: string;
  formattedE164: string;
  error?: string;
} => {
  const clean = phone.trim().replace(/[\s\-\.]/g, '');
  const normalized = clean.startsWith('+84')
    ? '0' + clean.slice(3)
    : clean.startsWith('84') && clean.length === 11
    ? '0' + clean.slice(2)
    : clean;

  const vnPhoneRegex = /^(03[2-9]|05[25689]|07[06-9]|08[1-9]|09[0-9])[0-9]{7}$/;
  if (!vnPhoneRegex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      formattedE164: '',
      error: 'Số điện thoại không đúng chuẩn đầu số nhà mạng Việt Nam (10 chữ số: Viettel, Mobifone, Vinaphone, Vietnamobile, Wintel, Itelecom).',
    };
  }

  return {
    isValid: true,
    normalized,
    formattedE164: '+84' + normalized.slice(1),
  };
};

/**
 * Khởi tạo Invisible reCAPTCHA container cho Firebase Phone Authentication
 */
export const setupPhoneRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA verified
    },
  });
};

/**
 * Gửi mã OTP qua SMS tới số điện thoại di động Việt Nam (chuẩn quốc tế E.164)
 */
export const sendPhoneOtpSms = async (
  phoneNumberE164: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(firebaseAuth, phoneNumberE164, verifier);
};

