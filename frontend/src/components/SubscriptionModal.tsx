import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Zap,
  Lock,
  Layers,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { SubscriptionStatus } from '../types';
import {
  apiCreatePayOSPayment,
  apiGetPayOSStatus,
} from '../services/api';
import { useToast } from './Toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  status: SubscriptionStatus | null;
  onClose: () => void;
  onRefreshStatus: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  status,
  onClose,
  onRefreshStatus,
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payOsConfigured, setPayOsConfigured] = useState<boolean | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      apiGetPayOSStatus()
        .then((res) => setPayOsConfigured(res.isConfigured))
        .catch(() => setPayOsConfigured(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPro = status?.tier === 'PRO';

  const handlePayOSPayment = async () => {
    try {
      setIsSubmitting(true);
      const res = await apiCreatePayOSPayment(billingCycle);
      if (res.checkoutUrl) {
        toast.info('Đang chuyển hướng tới cổng thanh toán VietQR PayOS...');
        window.location.href = res.checkoutUrl;
      } else {
        toast.info(
          res.error || 'Cổng thanh toán tự động VietQR chưa được kích hoạt khóa API. Vui lòng liên hệ quản trị viên!'
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo phiên thanh toán VietQR. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[620px] max-h-[92vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Crown size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Gói Hội Viên Gia Phả Số
                </h3>
                {isPro ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Miễn Phí (5 Nhánh)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Nâng tầm quản lý dòng họ với không gian lưu trữ không giới hạn
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Current Status Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Layers size={16} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Số nhánh cây hiện tại của bạn:</div>
                <div className="text-sm font-bold text-white">
                  {status?.totalBranches || 0} / {isPro ? 'Không giới hạn' : '5 nhánh miễn phí'}
                </div>
              </div>
            </div>

            {status?.lockedBranchesCount && status.lockedBranchesCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                <Lock size={12} />
                <span>{status.lockedBranchesCount} nhánh đang bị khóa</span>
              </div>
            ) : isPro ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <Sparkles size={12} />
                <span>Đang hoạt động</span>
              </div>
            ) : null}
          </div>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 max-w-[260px] mx-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                billingCycle === 'MONTHLY'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                billingCycle === 'YEARLY'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Theo Năm</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded-full font-bold">
                -35%
              </span>
            </button>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Free Plan */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-200">Gói Miễn Phí</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Mặc định
                  </span>
                </div>
                <div className="text-xl font-black text-white mb-3">0đ</div>
                <ul className="space-y-2 text-slate-400 text-[11px]">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>Tối đa <strong>5 nhánh cây gia phả</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>Xem sơ đồ cây & danh bạ dòng họ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>Lịch giỗ âm dương & nhắc nhở</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>Trắc nghiệm mini app gia đình</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <div className="w-full py-2 rounded-xl bg-slate-800/80 text-center text-slate-400 font-semibold text-xs cursor-default">
                  Gói Hiện Tại
                </div>
              </div>
            </div>

            {/* PRO Plan */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-slate-950 to-slate-950 border-2 border-amber-500/50 shadow-lg shadow-amber-950/30 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                <Sparkles size={10} />
                <span>Khuyên dùng</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Crown size={15} className="text-amber-400" />
                  <span className="font-bold text-sm text-amber-300">Gói PRO</span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-2xl font-black text-white">
                    {billingCycle === 'YEARLY' ? '399.000đ' : '49.000đ'}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    / {billingCycle === 'YEARLY' ? 'năm (33k/tháng)' : 'tháng'}
                  </span>
                </div>

                <ul className="space-y-2 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-2 font-medium text-emerald-300">
                    <Check size={13} className="text-emerald-400 flex-shrink-0" />
                    <span><strong>Không giới hạn số lượng nhánh cây</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Mở khóa toàn bộ các nhánh bị khóa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Xuất hình ảnh Ultra-HD siêu nét</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Xuất báo cáo & file Excel toàn diện</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Huy hiệu PRO trên hồ sơ</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePayOSPayment}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition"
                >
                  <Zap size={14} className="fill-slate-950" />
                  <span>{isPro ? 'Gia Hạn Gói PRO' : 'Nâng Cấp PRO Ngay'}</span>
                </button>
                {payOsConfigured && (
                  <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <span>Hỗ trợ quét VietQR Napas247 tự động kích hoạt</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
