import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import {
  apiLogin,
  apiRegister,
  apiCheckEmail,
  apiForgotPassword,
  apiResetPassword,
  setStoredToken,
  apiGetMe,
} from '../services/api';
import { User } from '../types';
import { useToast } from './Toast';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface AuthModalProps {
  onSuccess: (user: User, defaultTreeId?: string) => void;
  resetToken?: string | null;
  onClearResetToken?: () => void;
}

type AuthMode =
  | 'LOGIN'
  | 'REGISTER'
  | 'FORGOT_PASSWORD'
  | 'AWAITING_VERIFICATION'
  | 'AWAITING_RESET_EMAIL'
  | 'RESET_PASSWORD';

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  resetToken,
  onClearResetToken,
}) => {
  const toast = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Nếu URL có reset_token thì tự động mở màn hình đặt lại mật khẩu
  useEffect(() => {
    if (resetToken) {
      setAuthMode('RESET_PASSWORD');
      setError(null);
    }
  }, [resetToken]);

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
      if (event.key === 'gia_pha_token' && event.newValue) {
        try {
          const verifiedUser = await apiGetMe();
          toast.success(`Xác thực thành công! Chào mừng ${verifiedUser.fullName}`);
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
      const res = await apiLogin({
        email: email.toLowerCase().trim(),
        password,
      });

      setStoredToken(res.token);
      toast.success(`Chào mừng ${res.user.fullName || res.user.email} trở lại!`);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('chưa được xác thực')) {
        setError(msg);
      } else if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau!');
      } else {
        setError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng Ký Tài Khoản Mới
  // Nghiệp vụ chuẩn: Chưa tạo tài khoản trong DB! Chỉ gửi email xác thực qua Cloudflare.
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

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài từ 6 ký tự trở lên.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Kiểm tra email đã có trong hệ thống chưa
      const checkRes = await apiCheckEmail(cleanEmail);
      if (checkRes.exists) {
        setError('Email này đã tồn tại trong hệ thống! Vui lòng đăng nhập hoặc chọn Quên mật khẩu.');
        setIsLoading(false);
        return;
      }

      // 2. Gửi email xác nhận qua Cloudflare (Chưa tạo User trong DB)
      const res = await apiRegister({ email: cleanEmail, password, fullName: cleanFullName });

      toast.success(res.message || 'Đã gửi liên kết xác thực tới email của bạn!');
      setResendCooldown(60);
      setAuthMode('AWAITING_VERIFICATION');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('đã tồn tại')) {
        setError('Email này đã tồn tại trong hệ thống!');
      } else if (msg === 'Failed to fetch' || msg.includes('Failed to fetch')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau!');
      } else {
        setError(msg || 'Không thể gửi email xác thực.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Quên Mật Khẩu: Gửi email khôi phục qua Cloudflare
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await apiForgotPassword(cleanEmail);
      toast.success(res.message || 'Đã gửi liên kết đặt lại mật khẩu tới email của bạn!');
      setResendCooldown(60);
      setAuthMode('AWAITING_RESET_EMAIL');
    } catch (err: any) {
      setError(err.message || 'Email này chưa được đăng ký trong hệ thống Famlykin!');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đặt Lại Mật Khẩu Mới từ liên kết trong email
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await apiResetPassword({ token: resetToken, newPassword });
      toast.success(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      if (onClearResetToken) onClearResetToken();
      setAuthMode('LOGIN');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại email xác thực
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    const cleanEmail = email.toLowerCase().trim();
    setIsLoading(true);

    try {
      if (authMode === 'AWAITING_VERIFICATION') {
        await apiRegister({ email: cleanEmail, password, fullName });
      } else {
        await apiForgotPassword(cleanEmail);
      }
      toast.success('Đã gửi lại email xác thực thành công!');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lại email lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 15, 9, 0.85)',
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
            {/* Tabs: Đăng Nhập | Đăng Ký */}
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
                  lineHeight: 1.45,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister}>
              {authMode === 'REGISTER' && (
                <div style={{ marginBottom: '0.9rem', position: 'relative' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#cbd5e1',
                      marginBottom: '0.35rem',
                      textAlign: 'left',
                    }}
                  >
                    Họ và tên của bạn:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      className="auth-input-dark"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        background: '#0a1a12',
                        backgroundColor: '#0a1a12',
                        WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                        boxShadow: '0 0 0 1000px #0a1a12 inset',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        borderRadius: '11px',
                        color: '#f1f5f9',
                        fontSize: '0.92rem',
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
                </div>
              )}

              <div style={{ marginBottom: '0.9rem', position: 'relative' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '0.35rem',
                    textAlign: 'left',
                  }}
                >
                  Email đăng nhập:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '11px',
                      color: '#f1f5f9',
                      fontSize: '0.92rem',
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
              </div>

              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#cbd5e1',
                    }}
                  >
                    Mật khẩu:
                  </label>
                  {authMode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('FORGOT_PASSWORD');
                        setError(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '11px',
                      color: '#f1f5f9',
                      fontSize: '0.92rem',
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
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                  transition: 'all 0.15s ease',
                }}
              >
                {authMode === 'LOGIN' ? <LogIn size={17} /> : <UserPlus size={17} />}
                <span>
                  {isLoading
                    ? 'Đang xử lý...'
                    : authMode === 'LOGIN'
                    ? 'Đăng Nhập'
                    : 'Đăng Ký Tài Khoản'}
                </span>
              </button>
            </form>
          </>
        )}

        {/* Màn hình 3: Quên Mật Khẩu */}
        {authMode === 'FORGOT_PASSWORD' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 0.4rem 0', fontWeight: 700 }}>
                Khôi Phục Mật Khẩu
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu an toàn.
              </p>
            </div>

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
                  placeholder="name@example.com"
                  autoFocus
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
                    fontSize: '0.92rem',
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
                  marginBottom: '0.85rem',
                }}
              >
                <KeyRound size={17} />
                <span>{isLoading ? 'Đang gửi...' : 'Gửi Email Khôi Phục'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                ← Quay lại Đăng Nhập
              </button>
            </form>
          </div>
        )}

        {/* Màn hình 4: Đợi Nhận Mail Xác Thực Đăng Ký (Giao diện tối giản, tinh tế) */}
        {authMode === 'AWAITING_VERIFICATION' && (
          <div style={{ textAlign: 'center', padding: '0.8rem 0 0.4rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                border: '1.5px solid rgba(52, 211, 153, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <Mail size={30} color="#34d399" />
            </div>

            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0 0 0.65rem 0', fontWeight: 700 }}>
              Kiểm Tra Email Của Bạn
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Chúng tôi đã gửi liên kết xác thực tới địa chỉ:
              <br />
              <strong style={{ color: '#34d399', fontSize: '0.98rem' }}>{email}</strong>
              <br />
              <span style={{ fontSize: '0.84rem', color: '#94a3b8', display: 'inline-block', marginTop: '0.35rem' }}>
                Vui lòng mở email và nhấn vào liên kết để hoàn tất việc tạo tài khoản.
              </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  color: resendCooldown > 0 ? '#64748b' : '#34d399',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(52, 211, 153, 0.22)',
                  borderRadius: '10px',
                  cursor: (resendCooldown > 0 || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={14} />
                <span>
                  {resendCooldown > 0
                    ? `Gửi lại email sau (${resendCooldown}s)`
                    : 'Chưa nhận được email? Bấm để gửi lại'}
                </span>
              </button>

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
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  padding: '0.35rem',
                }}
              >
                ← Quay về Trang Đăng Nhập
              </button>
            </div>
          </div>
        )}

        {/* Màn hình 5: Đợi Nhận Mail Đặt Lại Mật Khẩu */}
        {authMode === 'AWAITING_RESET_EMAIL' && (
          <div style={{ textAlign: 'center', padding: '0.8rem 0 0.4rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
                margin: '0 auto 1.25rem auto',
              }}
            >
              <KeyRound size={30} color="#38bdf8" />
            </div>

            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0 0 0.65rem 0', fontWeight: 700 }}>
              Kiểm Tra Email Khôi Phục
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Chúng tôi đã gửi liên kết đặt lại mật khẩu tới:
              <br />
              <strong style={{ color: '#38bdf8', fontSize: '0.98rem' }}>{email}</strong>
              <br />
              <span style={{ fontSize: '0.84rem', color: '#94a3b8', display: 'inline-block', marginTop: '0.35rem' }}>
                Vui lòng mở email và nhấn vào liên kết để tạo mật khẩu mới.
              </span>
            </p>

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
                fontSize: '0.84rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                padding: '0.35rem',
                marginTop: '1rem',
              }}
            >
              ← Quay về Trang Đăng Nhập
            </button>
          </div>
        )}

        {/* Màn hình 6: Đặt Lại Mật Khẩu Mới (Khi người dùng nhấp liên kết từ email) */}
        {authMode === 'RESET_PASSWORD' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1.5px solid rgba(56, 189, 248, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto',
                }}
              >
                <KeyRound size={26} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 0.35rem 0', fontWeight: 700 }}>
                Tạo Mật Khẩu Mới
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: 0 }}>
                Vui lòng nhập mật khẩu mới để bảo mật tài khoản của bạn.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '0.9rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Mật khẩu mới:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Ít nhất 6 ký tự"
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '11px',
                      color: '#f1f5f9',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Lock size={17} color="#38bdf8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Xác nhận mật khẩu mới:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '11px',
                      color: '#f1f5f9',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock size={17} color="#38bdf8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.78rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '11px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
                  marginBottom: '0.85rem',
                }}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onClearResetToken) onClearResetToken();
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                ← Quay lại Đăng Nhập
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
