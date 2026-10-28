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
  apiCompleteRegistration,
  apiCheckEmail,
  apiForgotPassword,
  apiResetPassword,
  setStoredToken,
  apiGetMe,
} from '../services/api';
import {
  registerWithFirebaseAndSendVerification,
  resendFirebaseVerificationEmail,
  checkEmailVerified,
  loginWithFirebase,
  sendFirebasePasswordReset,
  signInWithGoogle,
} from '../services/firebase';
import { User } from '../types';
import { useToast } from './Toast';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import { TermsPolicyModal } from './TermsPolicyModal';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsInitialTab, setTermsInitialTab] = useState<'TERMS' | 'PRIVACY'>('TERMS');

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

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Thử đăng nhập qua backend PostgreSQL trước
      const res = await apiLogin({
        email: cleanEmail,
        password,
      });

      setStoredToken(res.token);
      toast.success(`Chào mừng ${res.user.fullName || res.user.email} trở lại!`);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      // 2. Nếu backend từ chối, kiểm tra trên Firebase Auth (có thể user vừa verify email nhưng chưa sync vào DB)
      try {
        const fbRes = await loginWithFirebase(cleanEmail, password);
        if (!fbRes.emailVerified) {
          setError('Tài khoản của bạn chưa được kích hoạt qua email. Vui lòng kiểm tra hộp thư để xác thực.');
          setAuthMode('AWAITING_VERIFICATION');
          setIsLoading(false);
          return;
        }

        // Email đã được kích hoạt -> Hoàn tất khởi tạo dữ liệu vào PostgreSQL Database
        const regRes = await apiCompleteRegistration({
          email: cleanEmail,
          password,
        });

        setStoredToken(regRes.token);
        toast.success(`Xác thực thành công! Chào mừng ${regRes.user.fullName || regRes.user.email}!`);
        onSuccess(regRes.user, regRes.defaultTreeId);
        return;
      } catch (fbErr: any) {
        // Cả 2 đều thất bại
      }

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
  // Best practice Firebase: Tạo user với emailVerified = false, bắn email xác thực (Hạn mức 1.000 mail/ngày).
  // Chặn ở Database: Chưa ghi bất kỳ dữ liệu nào vào PostgreSQL DB cho đến khi email được kích hoạt!
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
      // 1. Kiểm tra email đã có trong hệ thống Database chưa
      const checkRes = await apiCheckEmail(cleanEmail);
      if (checkRes.exists) {
        setError('Email này đã tồn tại trong hệ thống! Vui lòng đăng nhập hoặc chọn Quên mật khẩu.');
        setIsLoading(false);
        return;
      }

      // 2. Lưu thông tin đăng ký vào LocalStorage để sẵn sàng khởi tạo dữ liệu vào PostgreSQL khi kích hoạt
      localStorage.setItem(
        'famlykin_pending_signup',
        JSON.stringify({
          email: cleanEmail,
          fullName: cleanFullName,
          password,
        })
      );

      // 3. Đăng ký qua Firebase Auth & Tự động gửi email xác thực kích hoạt (1.000 mail/ngày)
      try {
        await registerWithFirebaseAndSendVerification(cleanEmail, password);
      } catch (fbRegErr: any) {
        if (fbRegErr?.code === 'auth/email-already-in-use') {
          // Email đã có trên Firebase Auth từ lần test trước -> thử login và gửi lại email
          try {
            const fbLogin = await loginWithFirebase(cleanEmail, password);
            if (!fbLogin.emailVerified) {
              await resendFirebaseVerificationEmail(fbLogin.user);
            } else {
              // Đã verify trên Firebase nhưng chưa có trong DB -> tạo luôn vào DB
              const res = await apiCompleteRegistration({
                email: cleanEmail,
                fullName: cleanFullName,
                password,
              });
              setStoredToken(res.token);
              toast.success(`Chào mừng ${res.user.fullName || res.user.email}!`);
              onSuccess(res.user, res.defaultTreeId);
              return;
            }
          } catch {
            setError('Email này đã tồn tại trong danh sách Firebase Auth từ các lần thử nghiệm trước (nhưng chưa có trong Database). Vui lòng vào Firebase Console > Authentication > Users và Xóa (Delete) tài khoản này để tạo mới, hoặc chọn Quên mật khẩu.');
            setIsLoading(false);
            return;
          }
        } else {
          throw fbRegErr;
        }
      }

      toast.success('Đã gửi email xác thực kích hoạt tài khoản!');
      setResendCooldown(60);
      setAuthMode('AWAITING_VERIFICATION');
    } catch (err: any) {
      console.error('Lỗi gửi email xác thực Firebase:', err);
      const code = err.code || '';
      if (code === 'auth/unauthorized-domain') {
        setError('Tên miền chưa được thêm vào Authorized domains trong Firebase Console (Authentication > Settings).');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Chức năng Email/Password chưa được bật trong Firebase Console (Authentication > Sign-in method).');
      } else if (code === 'auth/invalid-email') {
        setError('Địa chỉ email không hợp lệ.');
      } else {
        setError(err.message || 'Không thể gửi email xác thực qua Firebase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng Nhập / Đăng Ký bằng Google (Google Sign-In)
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const googleUser = await signInWithGoogle();
      if (!googleUser.email) {
        throw new Error('Không thể trích xuất địa chỉ email từ tài khoản Google.');
      }

      // Tài khoản Google luôn tự động xác thực email (emailVerified = true)
      // Tự động khởi tạo hoặc đồng bộ vào PostgreSQL Database (kèm avatar Google nếu có)
      const res = await apiCompleteRegistration({
        email: googleUser.email.toLowerCase().trim(),
        fullName: googleUser.displayName || undefined,
        avatarUrl: googleUser.photoURL || undefined,
      });

      setStoredToken(res.token);
      toast.success(`Đăng nhập Google thành công! Chào mừng ${res.user.fullName || res.user.email}`);
      onSuccess(res.user, res.defaultTreeId);
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      const code = err.code || '';
      if (code === 'auth/popup-closed-by-user') {
        // Người dùng tự tắt popup Google, không cần hiển thị lỗi
      } else if (code === 'auth/unauthorized-domain') {
        setError('Tên miền famlykin.pages.dev chưa được bật trong Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Đăng nhập Google chưa được kích hoạt trong Firebase Console (Authentication > Sign-in method > Google).');
      } else {
        setError(err.message || 'Không thể đăng nhập bằng Google lúc này.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Quên Mật Khẩu: Gửi email khôi phục qua Firebase
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const checkRes = await apiCheckEmail(cleanEmail);
      if (!checkRes.exists) {
        setError('Email này chưa được đăng ký trong hệ thống Famlykin!');
        setIsLoading(false);
        return;
      }

      await sendFirebasePasswordReset(cleanEmail);
      toast.success('Đã gửi liên kết đặt lại mật khẩu tới email của bạn!');
      setResendCooldown(60);
      setAuthMode('AWAITING_RESET_EMAIL');
    } catch (err: any) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', err);
      const code = err.code || '';
      if (code === 'auth/unauthorized-domain') {
        setError('Tên miền chưa được thêm vào Authorized domains trong Firebase Console (Authentication > Settings).');
      } else if (code === 'auth/user-not-found') {
        setError('Email này chưa tồn tại trong hệ thống xác thực.');
      } else {
        setError(err.message || 'Không thể gửi email đặt lại mật khẩu qua Firebase.');
      }
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
        await resendFirebaseVerificationEmail();
      } else {
        await sendFirebasePasswordReset(cleanEmail);
      }
      toast.success('Đã gửi lại email xác thực thành công!');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi lại email lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Người dùng xác nhận "Tôi Đã Xác Thực Xong" -> Kiểm tra Firebase & Lưu vào Database
  const handleCheckVerified = async () => {
    setIsLoading(true);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        const pendingRaw = localStorage.getItem('famlykin_pending_signup');
        let pending = null;
        if (pendingRaw) {
          try { pending = JSON.parse(pendingRaw); } catch {}
        }

        const res = await apiCompleteRegistration({
          email: email.toLowerCase().trim(),
          fullName: pending?.fullName || fullName,
          password: pending?.password || password,
        });

        localStorage.removeItem('famlykin_pending_signup');
        setStoredToken(res.token);
        toast.success(`Xác thực thành công! Chào mừng ${res.user.fullName || res.user.email}`);
        onSuccess(res.user, res.defaultTreeId);
      } else {
        toast.info('Hệ thống chưa nhận được tín hiệu kích hoạt. Vui lòng mở email và bấm vào liên kết xác thực trước.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Chưa thể kích hoạt. Vui lòng thử lại.');
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
          maxWidth: '390px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '1.5rem 1.6rem',
          background: 'rgba(10, 26, 18, 0.98)',
          borderRadius: '20px',
          border: '1px solid rgba(52, 211, 153, 0.32)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.18)',
          color: '#f1f5f9',
          animation: 'popUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.6rem auto',
            }}
          >
            <FamilyTreeLogo
              size={64}
              style={{
                filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 16px rgba(16, 185, 129, 0.3))',
              }}
            />
          </div>
          <h2
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Famlykin
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
                <div style={{ marginBottom: '0.7rem', position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên của bạn..."
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.72rem 1rem 0.72rem 2.5rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <UserIcon
                    size={16}
                    color="#34d399"
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '0.7rem', position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="Nhập địa chỉ email..."
                  className="auth-input-dark"
                  style={{
                    width: '100%',
                    padding: '0.72rem 1rem 0.72rem 2.5rem',
                    background: '#0a1a12',
                    backgroundColor: '#0a1a12',
                    WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                    boxShadow: '0 0 0 1000px #0a1a12 inset',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail
                  size={16}
                  color="#34d399"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.8rem', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                    className="auth-input-dark"
                    style={{
                      width: '100%',
                      padding: '0.72rem 2.5rem 0.72rem 2.5rem',
                      background: '#0a1a12',
                      backgroundColor: '#0a1a12',
                      WebkitBoxShadow: '0 0 0 1000px #0a1a12 inset',
                      boxShadow: '0 0 0 1000px #0a1a12 inset',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock
                    size={16}
                    color="#34d399"
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
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
                      right: '0.75rem',
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
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {authMode === 'LOGIN' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
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
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.72rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '10px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                {authMode === 'LOGIN' ? <LogIn size={16} /> : <UserPlus size={16} />}
                <span>
                  {isLoading
                    ? 'Đang xử lý...'
                    : authMode === 'LOGIN'
                    ? 'Đăng Nhập'
                    : 'Đăng Ký Tài Khoản'}
                </span>
              </button>
            </form>

            {/* Dải phân cách "Hoặc" */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '0.85rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Hoặc
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
            </div>

            {/* Nút Đăng nhập / Đăng ký bằng Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.72rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '11px',
                color: '#f1f5f9',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {authMode === 'LOGIN' ? 'Tiếp tục với Google' : 'Đăng ký bằng Google'}
              </span>
            </button>

            {/* Liên kết Điều khoản dịch vụ & Chính sách bảo mật */}
            <div
              style={{
                marginTop: '1.15rem',
                textAlign: 'center',
                fontSize: '0.74rem',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              <span>Bằng việc tiếp tục, bạn đồng ý với </span>
              <button
                type="button"
                onClick={() => {
                  setTermsInitialTab('TERMS');
                  setShowTermsModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34d399',
                  padding: 0,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Điều khoản dịch vụ
              </button>
              <span> & </span>
              <button
                type="button"
                onClick={() => {
                  setTermsInitialTab('PRIVACY');
                  setShowTermsModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34d399',
                  padding: 0,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Chính sách bảo mật
              </button>
              <span> của Famlykin.</span>
            </div>
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
                  placeholder="Nhập địa chỉ email của bạn..."
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
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  padding: '0.82rem 1.2rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '11px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>{isLoading ? 'Đang kiểm tra...' : 'Tôi đã bấm xác thực'}</span>
              </button>

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

      <TermsPolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab={termsInitialTab}
      />
    </div>
  );
};
