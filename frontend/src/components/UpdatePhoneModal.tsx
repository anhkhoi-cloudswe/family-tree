import React, { useState } from 'react';
import { X, Phone, CheckCircle, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { apiUpdatePhone } from '../services/api';
import { useToast } from './Toast';

interface UpdatePhoneModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const UpdatePhoneModal: React.FC<UpdatePhoneModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số (VD: 0987654321)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiUpdatePhone(cleanPhone);
      toast.success(res.message || 'Cập nhật số điện thoại thành công!');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật số điện thoại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/20 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Phone size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Cập Nhật Số Điện Thoại
              </h3>
              <p className="text-xs text-slate-400">
                Để người thân có thể tìm và mời bạn vào cây gia phả
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Số điện thoại của bạn <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={17} />
              </div>
              <input
                type="tel"
                required
                autoFocus
                placeholder="Ví dụ: 0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Số điện thoại này dùng làm định danh duy nhất khi người khác chia sẻ gia phả với bạn.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>
              Thông tin số điện thoại được bảo mật và chỉ dùng để nhận diện người trong cùng họ hàng.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle size={15} />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Số Điện Thoại'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePhoneModal;
