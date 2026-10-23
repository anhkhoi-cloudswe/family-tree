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
} from 'lucide-react';
import { apiLogin, apiRegister, apiCheckEmail, apiForgotPassword, setStoredToken } from '../services/api';
import { User } from '../types';
import { useToast } from './Toast';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { sendFirebaseMagicLink, sendFirebasePasswordReset } from '../services/firebase';

interface AuthModalProps {
  onSuccess: (user: User, defaultTreeId?: string) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'AWAITING_VERIFICATION' | 'AWAITING_RESET_EMAIL';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const toast = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Đếm ngược gửi lại email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Xử lý Đăng Nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiLogin({ email, password });
      setStoredToken(res.token);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng Ký Tài Khoản Mới
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Kiểm tra email đã có trong hệ thống chưa
      const checkRes = await apiCheckEmail(cleanEmail);
      if (checkRes.exists) {
        setError('Email này đã tồn tại trong hệ thống! Vui lòng đăng nhập hoặc sử dụng Quên mật khẩu.');
        setIsLoading(false);
        return;
      }

      // 2. Tạo tài khoản trong cơ sở dữ liệu
      await apiRegister({ email: cleanEmail, password });

      // 3. Tích hợp gửi Magic Link xác thực qua Firebase
      try {
        await sendFirebaseMagicLink(cleanEmail);
      } catch (fbErr: any) {
        console.warn('Lưu ý gửi Magic Link qua Firebase:', fbErr.message);
      }

      // 4. Chuyển sang modal đợi nhận email xác thực
      setResendCooldown(60);
      setAuthMode('AWAITING_VERIFICATION');
    } catch (err: any) {
      setError(err.message || 'Không thể tạo tài khoản mới.');
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
        await sendFirebaseMagicLink(cleanEmail);
      } else {
        await sendFirebasePasswordReset(cleanEmail);
      }
      toast.success('Đã gửi lại email xác thực thành công!');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error('Không thể gửi lại email lúc này. Vui lòng thử lại sau.');
    }
  };

  // Nút Demo nhanh (Member)
  const handleQuickDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiLogin({ email: 'demo@giapha.vn', password: 'Password123!' });
      setStoredToken(res.token);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      setError(err.message || 'Không thể đăng nhập bằng tài khoản demo');
    } finally {
      setIsLoading(false);
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
            {/* Nút Demo tiện lợi */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: '1px solid rgba(199, 210, 254, 0.5)',
                  borderRadius: '11px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px -2px rgba(79, 70, 229, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={16} color="#fef08a" />
                <span>Thử Nhanh: Đăng Nhập Mẫu (Demo)</span>
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                marginBottom: '1.2rem',
              }}
            >
              <div style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                hoặc tài khoản cá nhân
              </span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
            </div>

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
