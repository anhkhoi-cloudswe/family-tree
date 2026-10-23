import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  ActionCodeSettings,
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

const EMAIL_FOR_SIGN_IN_KEY = 'fam3_email_for_sign_in';

/**
 * Gửi Email Link (Magic Link) tới hộp thư người dùng qua Firebase Authentication
 * Best practice: Nhúng trực tiếp email vào redirect URL để hỗ trợ đa thiết bị/đa trình duyệt
 * không phụ thuộc vào LocalStorage (ví dụ: đăng ký trên Chromium nhưng mở email trên Chrome)
 */
export const sendFirebaseMagicLink = async (email: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();

  // Nhúng email vào callback URL để khi click trên bất kỳ trình duyệt/thiết bị nào cũng tự nhận diện
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
    message: `Đã gửi liên kết đăng nhập Magic Link tới ${cleanEmail}!`,
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
 * Trích xuất email từ URL query params hoặc continueUrl hoặc LocalStorage
 */
export const getEmailFromUrlOrStorage = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  let email = urlParams.get('email');

  if (!email && urlParams.get('continueUrl')) {
    try {
      const continueUrl = new URL(urlParams.get('continueUrl')!);
      email = continueUrl.searchParams.get('email');
    } catch {}
  }

  if (!email) {
    email = localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  }

  return email ? email.toLowerCase().trim() : null;
};

/**
 * Hoàn tất xác thực đăng nhập qua Firebase Email Link
 */
export const completeFirebaseSignIn = async (email: string): Promise<string> => {
  const result = await signInWithEmailLink(firebaseAuth, email, window.location.href);
  localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  return result.user?.email || email;
};
