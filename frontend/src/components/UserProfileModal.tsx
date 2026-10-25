import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  Camera,
  Lock,
  Save,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';
import {
  apiUpdateProfile,
  apiCloseAccount,
  apiGetPhoneOtpStatus,
  apiRequestPhoneOtp,
  apiVerifyPhoneOtp,
  apiUploadAvatar,
} from '../services/api';
import { uploadAvatarToSupabase, isSupabaseConfigured } from '../services/supabase';
import {
  setupPhoneRecaptcha,
  sendPhoneOtpSms,
  validateVietnamesePhone,
  ConfirmationResult,
} from '../services/firebase';
import { useToast } from './Toast';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
  onAccountClosed: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserUpdated,
  onAccountClosed,
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD' | 'DANGER'>('PROFILE');

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Phone OTP States & Rate Limit (Max 2 times/day)
  const [otpRemaining, setOtpRemaining] = useState<number>(2);
  const [isOtpLocked, setIsOtpLocked] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Danger Zone States
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosingAccount, setIsClosingAccount] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAvatarPreview(currentUser.avatarUrl || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCloseConfirm(false);
      setShowOtpInput(false);
      setOtpCode('');
    }
  }, [currentUser, isOpen]);

  // Load daily OTP rate limit status
  useEffect(() => {
    if (isOpen) {
      apiGetPhoneOtpStatus()
        .then((res) => {
          setOtpRemaining(res.remaining);
          setIsOtpLocked(res.isLocked);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);


  if (!isOpen || !currentUser) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      setIsUploadingAvatar(true);
      let uploadedUrl = '';
      if (isSupabaseConfigured()) {
        uploadedUrl = await uploadAvatarToSupabase(file);
      } else {
        uploadedUrl = await apiUploadAvatar(file);
      }
      setAvatarPreview(uploadedUrl);
      toast.success('Đã tải ảnh đại diện lên thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi tải ảnh đại diện: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
    if (!cleanPhone) {
      toast.error('Vui lòng nhập số điện thoại trước khi gửi mã OTP.');
      return;
    }

    const check = validateVietnamesePhone(cleanPhone);
    if (!check.isValid) {
      toast.error(check.error || 'Số điện thoại không đúng chuẩn đầu số nhà mạng Việt Nam.');
      return;
    }

    if (otpRemaining <= 0 || isOtpLocked) {
      toast.error('Bạn đã dùng hết 2 lượt nhận OTP hôm nay. Vui lòng quay lại vào ngày mai!');
      return;
    }

    try {
      setIsRequestingOtp(true);
      // 1. Kiểm tra rate limit và validate trên backend
      const res = await apiRequestPhoneOtp(cleanPhone);
      setOtpRemaining(res.remainingAttempts);
      if (res.remainingAttempts <= 0) {
        setIsOtpLocked(true);
      }

      // 2. Setup invisible reCAPTCHA và gửi SMS qua Firebase Auth
      let recaptchaVerifier = (window as any).phoneRecaptchaVerifier;
      if (!recaptchaVerifier) {
        recaptchaVerifier = setupPhoneRecaptcha('recaptcha-phone-container');
        (window as any).phoneRecaptchaVerifier = recaptchaVerifier;
      }

      const confResult = await sendPhoneOtpSms(res.formattedE164, recaptchaVerifier);
      setConfirmationResult(confResult);
      setShowOtpInput(true);
      setCountdown(60);
      toast.success(`Đã gửi mã xác thực OTP qua SMS tới ${res.normalizedPhone}!`);
    } catch (err: any) {
      console.error('Lỗi gửi SMS OTP:', err);
      toast.error(err.message || 'Không thể gửi SMS OTP qua Firebase. Vui lòng kiểm tra lại cấu hình.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      toast.error('Mã OTP gồm 6 chữ số từ tin nhắn SMS.');
      return;
    }

    if (!confirmationResult) {
      toast.error('Phiên gửi mã OTP đã hết hiệu lực. Vui lòng gửi lại.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      // 1. Xác thực với Firebase Auth
      await confirmationResult.confirm(cleanCode);

      // 2. Cập nhật số điện thoại đã xác thực trên backend
      const res = await apiVerifyPhoneOtp(phone.trim());
      toast.success('Xác thực số điện thoại chính chủ thành công!');
      setShowOtpInput(false);
      setOtpCode('');
      onUserUpdated(res.user);
    } catch (err: any) {
      console.error('Lỗi xác thực mã OTP:', err);
      toast.error(err.message || 'Mã OTP không chính xác hoặc đã hết hiệu lực.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone) {
      const check = validateVietnamesePhone(cleanPhone);
      if (!check.isValid) {
        toast.error(check.error || 'Số điện thoại không đúng chuẩn đầu số nhà mạng Việt Nam.');
        return;
      }
    }

    try {
      setIsSavingProfile(true);
      const res = await apiUpdateProfile({
        fullName: cleanName,
        phone: cleanPhone || undefined,
        avatarUrl: avatarPreview || undefined,
      });

      toast.success(res.message || 'Cập nhật thông tin thành công!');
      onUserUpdated(res.user);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await apiUpdateProfile({
        currentPassword,
        newPassword,
      });

      toast.success(res.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('PROFILE');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCloseAccount = async () => {
    try {
      setIsClosingAccount(true);
      const res = await apiCloseAccount();
      toast.info(res.message || 'Tài khoản đã chuyển sang trạng thái chờ xóa 30 ngày.');
      onClose();
      onAccountClosed();
    } catch (err: any) {
      toast.error(err.message || 'Không thể đóng tài khoản.');
      setIsClosingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Fixed consistent size container: 460px width & min-h 490px on all tabs */}
      <div className="relative w-full max-w-[460px] min-h-[490px] max-h-[92vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-[56px] px-4 sm:px-5 border-b border-emerald-500/20 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserIcon size={17} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                Hồ Sơ Cá Nhân
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {currentUser.email} • {currentUser.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="h-[42px] flex border-b border-slate-800 bg-slate-950/40 px-2 sm:px-3 text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('PROFILE'); setShowCloseConfirm(false); }}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon size={13} />
            <span className="hidden sm:inline">Thông Tin Cá Nhân</span>
            <span className="sm:hidden">Thông Tin</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('PASSWORD'); setShowCloseConfirm(false); }}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PASSWORD'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound size={13} />
            <span className="hidden sm:inline">Đổi Mật Khẩu</span>
            <span className="sm:hidden">Mật Khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('DANGER'); setShowCloseConfirm(false); }}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'DANGER'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert size={13} />
            <span>Đóng Tài Khoản</span>
          </button>
        </div>

        {/* Modal Content Area (Unified flex-col justify-between to keep all tabs uniform) */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col justify-between text-sm">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Avatar Section */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-full bg-emerald-800/40 border-2 border-emerald-500/50 flex items-center justify-center font-bold text-lg text-emerald-300 overflow-hidden shadow-md">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(fullName || currentUser.email).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <label
                      className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {isUploadingAvatar ? 'Đang tải ảnh lên...' : 'Nhấn máy ảnh để đổi avatar'}
                  </span>
                </div>

                {/* Email Readonly */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Email đăng nhập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                      <Mail size={13} />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon size={13} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Phone Section with SMS OTP verification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Số điện thoại chính chủ
                    </label>
                    {phone && currentUser.phone === phone ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <CheckCircle2 size={10} /> Đã xác thực
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <ShieldAlert size={10} /> Chưa xác thực SMS
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={13} />
                    </div>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (showOtpInput) setShowOtpInput(false);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* OTP Button & Rate Limit Status */}
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">
                      Hạn mức: <strong className={otpRemaining > 0 ? "text-emerald-400" : "text-rose-400"}>{otpRemaining}/2 lượt</strong> hôm nay
                    </span>

                    {phone && phone !== currentUser.phone && (
                      <button
                        type="button"
                        disabled={isRequestingOtp || isOtpLocked || otpRemaining <= 0 || !validateVietnamesePhone(phone).isValid}
                        onClick={handleSendPhoneOtp}
                        className="font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isRequestingOtp ? 'Đang gửi SMS...' : 'Gửi mã OTP (SMS)'}</span>
                      </button>
                    )}
                  </div>

                  {/* Rate Limit Exceeded Notice */}
                  {isOtpLocked && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>Bạn đã dùng hết 2/2 lượt gửi SMS OTP hôm nay. Vui lòng thử lại vào ngày mai.</span>
                    </div>
                  )}

                  {/* OTP Input Form when SMS is sent */}
                  {showOtpInput && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2 mt-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                        <span>Nhập 6 số mã OTP từ tin nhắn SMS:</span>
                        <span className="text-slate-400 text-[10px]">
                          {countdown > 0 ? `Còn ${countdown}s` : 'Hết hạn'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 py-1.5 px-3 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white tracking-widest text-center font-bold"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          onClick={handleVerifyOtp}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {isVerifyingOtp ? 'Đang duyệt...' : 'Xác Thực'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOtpInput(false)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Invisible Recaptcha container for Firebase Phone Auth */}
                  <div id="recaptcha-phone-container"></div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Security tip to balance visual weight */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2">
                  <KeyRound size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Sử dụng mật khẩu tối thiểu 6 ký tự để bảo vệ thông tin gia phả và quyền quản lý của bạn.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mật khẩu hiện tại <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={13} />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Nhập mật khẩu hiện tại"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mật khẩu mới (Tối thiểu 6 ký tự) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={13} />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={13} />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <KeyRound size={14} />
                  <span>{isSavingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ĐÓNG TÀI KHOẢN (Bảo lưu & Ân hạn 30 ngày) */}
          {activeTab === 'DANGER' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Policy card with polished, humane wording */}
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-300">
                    <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
                    <span>Chính Sách Bảo Lưu & Ân Hạn 30 Ngày</span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold text-sm leading-none">•</span>
                      <p>
                        <strong className="text-white">Tạm ngưng hoạt động:</strong> Sau khi đóng, tài khoản sẽ tự động đăng xuất và tạm ngưng quyền truy cập.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold text-sm leading-none">•</span>
                      <p>
                        <strong className="text-white">Bảo lưu toàn vẹn dữ liệu:</strong> Cây gia phả và thông tin dòng họ vẫn được giữ an toàn. Bạn có <strong>30 ngày</strong> để đăng nhập lại và khôi phục tài khoản bất kỳ lúc nào.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold text-sm leading-none">•</span>
                      <p>
                        <strong className="text-white">Tự động hủy sau thời hạn:</strong> Sau thời hạn 30 ngày nếu không có yêu cầu khôi phục, tài khoản mới chính thức được đóng vĩnh viễn.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helpful genealogy reminder to balance layout */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-center gap-2">
                  <span className="text-amber-400 text-sm flex-shrink-0">💡</span>
                  <span>
                    Nếu bạn đang là người quản trị cây phả hệ, hãy chuyển giao quyền cho thành viên khác trước khi rời đi.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                {!showCloseConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-rose-200 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 size={14} />
                    <span>Yêu Cầu Tạm Dừng & Đóng Tài Khoản</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-rose-200 font-medium text-center">
                      Bạn có chắc muốn đóng tài khoản? Bạn sẽ được đăng xuất và có 30 ngày để suy nghĩ và khôi phục lại.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isClosingAccount}
                        onClick={handleCloseAccount}
                        className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>{isClosingAccount ? 'Đang xử lý...' : 'Xác Nhận Đóng'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCloseConfirm(false)}
                        className="py-2 px-3.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

