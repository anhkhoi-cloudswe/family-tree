import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Sparkles,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import { apiLogin, apiRegister, apiCheckEmail, apiForgotPassword, setStoredToken, apiGetMe, getStoredToken, apiMagicLogin } from '../services/api';
import { User } from '../types';
import { useToast } from './Toast';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { sendFirebaseMagicLink, sendFirebasePasswordReset } from '../services/firebase';
import { sendMagicLink, verifySupabaseOtp, isSupabaseConfigured } from '../services/supabase';

interface AuthModalProps {
  onSuccess: (user: User, defaultTreeId?: string) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'AWAITING_VERIFICATION' | 'AWAITING_RESET_EMAIL';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const toast = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Đếm ngược gửi lại email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Lắng nghe sự kiện xác thực email hoàn tất từ tab khác trong cùng trình duyệt
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'fam3_auth_token' && event.newValue) {
        try {
          const verifiedUser = await apiGetMe();
          toast.success(`Xác thực email thành công! Chào mừng ${verifiedUser.fullName}`);
          onSuccess(verifiedUser);
        } catch (err) {
          console.error('Lỗi tự động đăng nhập sau xác thực:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onSuccess, toast]);

  // Xử lý Đăng Nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const res = await apiLogin({ email: cleanEmail, password });
      setStoredToken(res.token);
      if (res.defaultTreeId) {
        localStorage.setItem('fam3_current_tree_id', res.defaultTreeId);
      }
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('chưa được xác thực qua email')) {
        setError(msg);
        setAuthMode('AWAITING_VERIFICATION');
        toast.info('Vui lòng kiểm tra hộp thư để xác thực tài khoản.');
      } else if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau!');
      } else {
        setError(msg || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng Ký Tài Khoản Mới: gửi Firebase Email Link và đợi người dùng nhấp link
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const cleanFullName = fullName.trim();

    if (!cleanFullName) {
      setError('Vui lòng nhập họ và tên của bạn.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Kiểm tra email đã có trong hệ thống chưa
      const checkRes = await apiCheckEmail(cleanEmail);
      if (checkRes.exists) {
        setError('Email này đã tồn tại trong hệ thống!');
        setIsLoading(false);
        return;
      }

      // 2. Tạo tài khoản trong cơ sở dữ liệu kèm họ và tên (trạng thái isVerified: false)
      await apiRegister({ email: cleanEmail, password, fullName: cleanFullName });

      // 3. Gửi email xác thực an toàn: Ưu tiên Supabase (GitHub Secrets), fallback Firebase
      let sentSuccess = false;
      let lastErrMsg = '';

      try {
        await sendMagicLink(cleanEmail);
        sentSuccess = true;
      } catch (sbErr: any) {
        console.warn('Lỗi gửi email xác thực qua Supabase, thử Firebase:', sbErr.message);
        lastErrMsg = sbErr.message;
        try {
          await sendFirebaseMagicLink(cleanEmail);
          sentSuccess = true;
        } catch (fbErr: any) {
          console.error('Lỗi gửi email xác thực qua Firebase:', fbErr.message);
          lastErrMsg = fbErr.message;
        }
      }

      if (!sentSuccess) {
        setError(`Không thể gửi email xác thực: ${lastErrMsg}. Vui lòng kiểm tra lại email hoặc cấu hình.`);
        setIsLoading(false);
        return;
      }

      toast.success('Đã gửi email xác thực an toàn tới hộp thư của bạn!');
      // 4. Chuyển sang trạng thái đợi người dùng nhấp liên kết trong email (KHÔNG cho vào trực tiếp)
      setResendCooldown(60);
      setAuthMode('AWAITING_VERIFICATION');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('đã tồn tại')) {
        setError('Email này đã tồn tại trong hệ thống!');
      } else if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau!');
      } else {
        setError(msg || 'Không thể tạo tài khoản mới.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Quên Mật Khẩu
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Kiểm tra email có tồn tại trong hệ thống không
      await apiForgotPassword(cleanEmail);

      // 2. Gửi Email đặt lại mật khẩu an toàn qua Firebase
      try {
        await sendFirebasePasswordReset(cleanEmail);
      } catch (fbErr: any) {
        console.warn('Firebase password reset email:', fbErr.message);
      }

      // 3. Chuyển sang modal thông báo kiểm tra hòm thư
      setResendCooldown(60);
      setAuthMode('AWAITING_RESET_EMAIL');
    } catch (err: any) {
      setError(err.message || 'Email này chưa được đăng ký trong hệ thống Fam3!');
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại email xác thực
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const cleanEmail = email.toLowerCase().trim();
    try {
      if (authMode === 'AWAITING_VERIFICATION') {
        let sent = false;
        try {
          await sendMagicLink(cleanEmail);
          sent = true;
        } catch {
          await sendFirebaseMagicLink(cleanEmail);
          sent = true;
        }
      } else {
        try {
          await sendFirebasePasswordReset(cleanEmail);
        } catch {
          await sendMagicLink(cleanEmail);
        }
      }
      toast.success('Đã gửi lại email xác thực thành công!');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error('Không thể gửi lại email lúc này. Vui lòng thử lại sau.');
    }
  };

  // Xác thực mã OTP 6 số
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Vui lòng nhập mã số xác thực (OTP 6 số) từ email');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      await verifySupabaseOtp(cleanEmail, otpCode.trim());
      const res = await apiMagicLogin(cleanEmail);
      setStoredToken(res.token);
      toast.success(`Xác thực thành công! Chào mừng ${res.user.fullName || res.user.email}`);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      console.error('Lỗi xác thực OTP:', err);
      toast.error(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isGmail = email.toLowerCase().includes('@gmail.com');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 15, 9, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
    >
      <div
        className="auth-modal-card"
        style={{
          maxWidth: '430px',
          width: '100%',
          padding: '2.2rem 2.4rem',
          background: 'rgba(10, 26, 18, 0.98)',
          borderRadius: '22px',
          border: '1px solid rgba(52, 211, 153, 0.32)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.18)',
          color: '#f1f5f9',
          animation: 'popUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.4) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.3)',
            }}
          >
            <FamilyTreeLogo size={34} />
          </div>
          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Famlykin - Cây Gia Phả
          </h2>
        </div>

        {/* Màn hình 1 & 2: Đăng Nhập hoặc Đăng Ký */}
        {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
          <>


            {/* Chỉ 2 Tabs: Đăng Nhập | Đăng Ký */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.28rem',
                borderRadius: '11px',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  borderRadius: '8px',
                  border: authMode === 'LOGIN' ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  background: authMode === 'LOGIN'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)'
                    : 'transparent',
                  color: authMode === 'LOGIN' ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: authMode === 'LOGIN' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Đăng Nhập
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  borderRadius: '8px',
                  border: authMode === 'REGISTER' ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  background: authMode === 'REGISTER'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)'
                    : 'transparent',
                  color: authMode === 'REGISTER' ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: authMode === 'REGISTER' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Đăng Ký
              </button>
            </div>

            {/* Thông báo lỗi */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '1.15rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Form Đăng Nhập / Đăng Ký */}
            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister}>
              {/* Họ và tên (Chỉ hiển thị khi Đăng Ký) */}
              {authMode === 'REGISTER' && (
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên của bạn..."
                    aria-label="Họ và tên"
                    autoComplete="name"
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.78rem 1rem 0.78rem 2.6rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '11px',
                      color: '#f1f5f9',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <UserIcon
                    size={17}
                    color="#34d399"
                    style={{
                      position: 'absolute',
                      left: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}

              {/* Email field (Màu tối đồng bộ nền, triệt tiêu viền trắng autofill) */}
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email..."
                  aria-label="Địa chỉ email"
                  autoComplete="email"
                  className="auth-input-dark"
                  style={{
                    width: '100%',
                    padding: '0.78rem 1rem 0.78rem 2.6rem',
                    background: '#0a1a12',
                    backgroundColor: '#0a1a12',
                    WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                    boxShadow: '0 0 0 1000px #0a1a12 inset',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '11px',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail
                  size={17}
                  color="#34d399"
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Password field (Màu tối đồng bộ nền, toggle ẩn hiện password) */}
              <div style={{ marginBottom: authMode === 'LOGIN' ? '0.75rem' : '1.35rem', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu..."
                  aria-label="Mật khẩu"
                  autoComplete={authMode === 'REGISTER' ? 'new-password' : 'current-password'}
                  className="auth-input-dark"
                  style={{
                    width: '100%',
                    padding: '0.78rem 2.6rem 0.78rem 2.6rem',
                    background: '#0a1a12',
                    backgroundColor: '#0a1a12',
                    WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                    boxShadow: '0 0 0 1000px #0a1a12 inset',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '11px',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock
                  size={17}
                  color="#34d399"
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Quên mật khẩu? (Gọn gàng như yêu cầu) */}
              {authMode === 'LOGIN' && (
                <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 500,
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                    onClick={() => {
                      setAuthMode('FORGOT_PASSWORD');
                      setError(null);
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  padding: '0.78rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '11px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {authMode === 'LOGIN' ? (
                  <>
                    <LogIn size={18} />
                    <span>{isLoading ? 'Đang xử lý...' : 'Đăng Nhập Hệ Thống'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Mới'}</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Màn hình 3: Quên Mật Khẩu */}
        {authMode === 'FORGOT_PASSWORD' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0,
                  marginBottom: '1rem',
                }}
              >
                <ArrowLeft size={16} />
                <span>Quay lại đăng nhập</span>
              </button>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 0.35rem 0', fontWeight: 700 }}>
                Khôi Phục Mật Khẩu
              </h3>
              <p style={{ fontSize: '0.83rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Nhập email của bạn. Hệ thống sẽ kiểm tra tài khoản và gửi liên kết đặt lại mật khẩu an toàn.
              </p>
            </div>

            {/* Lỗi thông báo */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '1.15rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email của bạn..."
                  aria-label="Email khôi phục"
                  autoComplete="email"
                  className="auth-input-dark"
                  style={{
                    width: '100%',
                    padding: '0.78rem 1rem 0.78rem 2.6rem',
                    background: '#0a1a12',
                    backgroundColor: '#0a1a12',
                    WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                    boxShadow: '0 0 0 1000px #0a1a12 inset',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '11px',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail
                  size={17}
                  color="#34d399"
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  padding: '0.78rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '11px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                }}
              >
                <KeyRound size={17} />
                <span>{isLoading ? 'Đang kiểm tra...' : 'Gửi Email Khôi Phục'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Màn hình 4: Đợi Nhận Mail Xác Thực Đăng Ký (Thiết kế SaaS đẳng cấp) */}
        {authMode === 'AWAITING_VERIFICATION' && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                margin: '0 auto 1.4rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <Mail size={32} color="#34d399" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Kiểm Tra Hộp Thư Của Bạn
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
              Tài khoản đã được tạo! Fam3 đã gửi liên kết Magic Link xác thực tới địa chỉ:
              <br />
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {email}
              </span>
            </p>

            {/* Live Verification Waiting Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.42rem 0.95rem',
                borderRadius: '999px',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.32)',
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <span className="pulsing-dot" style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              <span>Hệ thống đang đợi bạn nhấp liên kết trong thư...</span>
            </div>

            {/* Nhập mã OTP 6 số từ email */}
            <form onSubmit={handleVerifyOtp} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem', textAlign: 'left' }}>
                Hoặc nhập mã số xác thực (OTP) nhận được trong email:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Ví dụ: 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textAlign: 'center',
                  }}
                />
                <button
                  type="submit"
                  disabled={isVerifyingOtp || !otpCode.trim()}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: (isVerifyingOtp || !otpCode.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isVerifyingOtp || !otpCode.trim()) ? 0.6 : 1,
                  }}
                >
                  {isVerifyingOtp ? 'Đang duyệt...' : 'Xác Thực'}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {isGmail && (
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.72rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <ExternalLink size={16} />
                  <span>Mở Hộp Thư Gmail</span>
                </a>
              )}

              {/* Check button: Kiểm tra xác thực thực tế */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const cleanEmail = email.toLowerCase().trim();
                    const res = await apiMagicLogin(cleanEmail);
                    setStoredToken(res.token);
                    toast.success(`Chào mừng ${res.user.fullName || res.user.email}!`);
                    onSuccess(res.user, res.defaultTreeId);
                  } catch (err: any) {
                    toast.info('Tài khoản chưa được kích hoạt. Vui lòng mở email và nhấn vào liên kết xác thực (hoặc nhập mã OTP phía trên).');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.68rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircle2 size={16} color="#34d399" />
                <span>Tôi đã nhấp liên kết trong thư</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.68rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  color: resendCooldown > 0 ? '#64748b' : '#34d399',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: '10px',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RotateCcw size={14} />
                <span>
                  {resendCooldown > 0
                    ? `Chưa nhận được? Gửi lại sau (${resendCooldown}s)`
                    : 'Chưa nhận được email? Bấm để gửi lại'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              ← Quay về Trang Đăng Nhập
            </button>
          </div>
        )}

        {/* Màn hình 5: Đợi Nhận Mail Đặt Lại Mật Khẩu (Thiết kế SaaS đẳng cấp) */}
        {authMode === 'AWAITING_RESET_EMAIL' && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                position: 'relative',
                width: '72px',
                height: '72px',
                margin: '0 auto 1.4rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.35) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
                }}
              >
                <CheckCircle2 size={32} color="#38bdf8" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Đã Gửi Liên Kết Khôi Phục
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
              Chúng tôi đã gửi email đặt lại mật khẩu an toàn tới địa chỉ:
              <br />
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {email}
              </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {isGmail && (
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.72rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
                  }}
                >
                  <ExternalLink size={16} />
                  <span>Mở Hộp Thư Gmail</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.68rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  color: resendCooldown > 0 ? '#64748b' : '#38bdf8',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RotateCcw size={14} />
                <span>
                  {resendCooldown > 0
                    ? `Chưa nhận được? Gửi lại sau (${resendCooldown}s)`
                    : 'Chưa nhận được email? Bấm để gửi lại'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              ← Quay về Trang Đăng Nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
