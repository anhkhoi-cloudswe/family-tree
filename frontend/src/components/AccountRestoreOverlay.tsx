import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, LogOut, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { User } from '../types';
import { apiRestoreAccount } from '../services/api';
import { useToast } from './Toast';

interface AccountRestoreOverlayProps {
  user: User;
  onRestored: (updatedUser: User) => void;
  onLogout: () => void;
}

export const AccountRestoreOverlay: React.FC<AccountRestoreOverlayProps> = ({
  user,
  onRestored,
  onLogout,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const toast = useToast();

  // Tính số ngày còn lại trong thời gian ân hạn 30 ngày
  const calculateDaysRemaining = (): number => {
    if (!user.deletedAt) return 30;
    const deletedTime = new Date(user.deletedAt).getTime();
    const now = Date.now();
    const daysPassed = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const daysRemaining = calculateDaysRemaining();

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const res = await apiRestoreAccount();
      toast.success(res.message || 'Khôi phục tài khoản thành công! Chào mừng bạn quay trở lại.');
      onRestored(res.user);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi khôi phục tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-500/50 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.3)] overflow-hidden text-slate-100 p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Glow & Warning Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-950/60 animate-bounce duration-1000">
          <AlertTriangle size={38} className="text-rose-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          Tài Khoản Đang Chờ Xóa
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed max-w-md">
          Chào <strong className="text-emerald-300">{user.fullName || user.email}</strong>, bạn đã yêu cầu đóng tài khoản này trước đó. Tài khoản của bạn hiện đang trong thời gian ân hạn 30 ngày.
        </p>

        {/* Days Remaining Pill */}
        <div className="mb-6 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-2.5 shadow-md">
          <Clock size={18} className="text-amber-400 flex-shrink-0 animate-pulse" />
          <span className="font-bold text-sm">
            Còn lại {daysRemaining} ngày để khôi phục tài khoản
          </span>
        </div>

        {/* Policy Details */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1.5 mb-6 text-left">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Chính sách bảo lưu dữ liệu dòng họ:</span>
          </div>
          <p>
            • Toàn bộ cây phả hệ, thông tin thành viên và ngày giỗ vẫn được giữ nguyên vẹn.
          </p>
          <p>
            • Sau <strong>{daysRemaining} ngày</strong> nữa, nếu không khôi phục, tài khoản này sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isRestoring}
            onClick={handleRestore}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <RotateCcw size={17} className={isRestoring ? 'animate-spin' : ''} />
            <span>{isRestoring ? 'Đang khôi phục...' : 'Khôi Phục Tài Khoản Ngay'}</span>
          </button>

          <button
            type="button"
            disabled={isRestoring}
            onClick={onLogout}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <LogOut size={16} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountRestoreOverlay;
