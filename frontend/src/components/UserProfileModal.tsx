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
} from 'lucide-react';
import { User } from '../types';
import { apiUpdateProfile, apiCloseAccount } from '../services/api';
import { uploadAvatarToSupabase, isSupabaseConfigured } from '../services/supabase';
import { apiUploadAvatar } from '../services/api';
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
    }
  }, [currentUser, isOpen]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(cleanPhone)) {
        toast.error('Số điện thoại không hợp lệ (10 chữ số chuẩn VN).');
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
      {/* Fixed consistent size container: 480px width & 540px height on all tabs */}
      <div className="relative w-full max-w-[480px] h-[540px] max-h-[92vh] bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header (Fixed height 60px) */}
        <div className="h-[60px] px-5 border-b border-emerald-500/20 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserIcon size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Hồ Sơ & Cài Đặt
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {currentUser.email} • {currentUser.role === 'ADMIN' ? 'Admin' : 'Thành viên'}
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

        {/* Modal Navigation Tabs (Fixed height 44px) */}
        <div className="h-[44px] flex border-b border-slate-800 bg-slate-950/40 px-3 text-xs font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon size={13} />
            <span>Thông Tin Cá Nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PASSWORD')}
            className={`flex-1 border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'PASSWORD'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound size={13} />
            <span>Đổi Mật Khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DANGER')}
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

        {/* Modal Content Area (flex-1 with flex-col justify-between to keep layout uniform) */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between text-sm">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Avatar Section */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full bg-emerald-800/40 border-2 border-emerald-500/50 flex items-center justify-center font-bold text-xl text-emerald-300 overflow-hidden shadow-md">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(fullName || currentUser.email).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <label
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera size={13} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {isUploadingAvatar ? 'Đang tải...' : 'Nhấn máy ảnh để đổi avatar'}
                  </span>
                </div>

                {/* Email Readonly */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Email đăng nhập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail size={14} />
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon size={14} />
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

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Số điện thoại nhận lời mời gia phả
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} className="flex-1 flex flex-col justify-between">
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mật khẩu hiện tại <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={14} />
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
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <KeyRound size={15} />
                  <span>{isSavingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ĐÓNG TÀI KHOẢN (Ân hạn 30 ngày) */}
          {activeTab === 'DANGER' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-400">
                  <AlertTriangle size={16} />
                  <span>Chính Sách Ân Hạn 30 Ngày</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-rose-400">•</span>
                    <span>Tài khoản sẽ chuyển sang trạng thái <strong>Chờ xóa (PENDING_DELETE)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>Bạn có <strong>30 ngày</strong> để đăng nhập lại và khôi phục tài khoản nguyên vẹn.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>Sau thời hạn 30 ngày, hệ thống sẽ thực hiện xóa vĩnh viễn khỏi cơ sở dữ liệu.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                {!showCloseConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 size={15} />
                    <span>Tôi muốn yêu cầu đóng tài khoản này</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/50 space-y-2.5">
                    <p className="text-[11px] text-rose-300 font-semibold text-center">
                      Bạn có chắc muốn đóng tài khoản? Bạn sẽ được đăng xuất ngay lập tức.
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
                        className="py-2 px-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
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
