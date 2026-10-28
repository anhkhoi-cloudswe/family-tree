import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Zap,
  Lock,
  Layers,
  ArrowLeft,
  Copy,
  CheckCircle2,
  QrCode,
  RefreshCw,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { User, SubscriptionStatus } from '../types';
import {
  apiGetSubscriptionStatus,
  apiUpgradeSubscription,
  apiGetSePayConfig,
} from '../services/api';
import { useToast } from './Toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  status: SubscriptionStatus | null;
  user?: User | null;
  onClose: () => void;
  onRefreshStatus: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  status,
  user,
  onClose,
  onRefreshStatus,
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [step, setStep] = useState<'PLANS' | 'PAYMENT' | 'SUCCESS'>('PLANS');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isDemoUpgrading, setIsDemoUpgrading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [sepayConfig, setSepayConfig] = useState({
    bankAccount: '2911121319',
    bankName: 'MBBank',
    accountHolder: 'TRAN ANH KHOI',
  });

  const toast = useToast();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch SePay bank configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      apiGetSePayConfig()
        .then((res) => {
          if (res && res.bankAccount) {
            setSepayConfig({
              bankAccount: res.bankAccount,
              bankName: res.bankName || 'MBBank',
              accountHolder: res.accountHolder || 'TRAN ANH KHOI',
            });
          }
        })
        .catch(() => {
          // Keep defaults
        });
      setStep('PLANS');
      setQrLoaded(false);
    }
  }, [isOpen]);

  // Amount & Transfer Content Memo calculation
  const isYearly = billingCycle === 'YEARLY';
  const amount = isYearly ? 399000 : 49000;
  const amountFormatted = isYearly ? '399.000đ' : '49.000đ';

  const cleanPhone = user?.phone ? user.phone.replace(/[^0-9]/g, '') : '';
  const transferMemo = cleanPhone
    ? `PRO ${cleanPhone}`
    : `PRO ${user?.id ? user.id.slice(0, 8) : 'VIP'}`;

  // SePay VietQR Image URL
  const qrUrl = `https://qr.sepay.vn/img?acc=${sepayConfig.bankAccount}&bank=${sepayConfig.bankName}&amount=${amount}&des=${encodeURIComponent(
    transferMemo
  )}`;

  // Polling for SePay Webhook Auto-Activation while in PAYMENT step
  useEffect(() => {
    if (!isOpen || step !== 'PAYMENT') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const current = await apiGetSubscriptionStatus();
        if (current.tier === 'PRO') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStep('SUCCESS');
          toast.success('Thanh toán thành công! Gói PRO của bạn đã được kích hoạt.');
          onRefreshStatus();
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } catch (err) {
        // silent polling catch
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, step, onClose, onRefreshStatus, toast]);

  if (!isOpen) return null;

  const isPro = status?.tier === 'PRO';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualCheck = async () => {
    try {
      setIsCheckingPayment(true);
      const current = await apiGetSubscriptionStatus();
      if (current.tier === 'PRO') {
        setStep('SUCCESS');
        toast.success('Tuyệt vời! Gói PRO của bạn đã được xác nhận.');
        onRefreshStatus();
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        toast.info('Hệ thống đang đồng bộ biến động số dư từ ngân hàng. Vui lòng đợi trong giây lát...');
      }
    } catch (err: any) {
      toast.error('Không thể kiểm tra trạng thái thanh toán, vui lòng thử lại sau.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleDemoUpgrade = async () => {
    try {
      setIsDemoUpgrading(true);
      const res = await apiUpgradeSubscription(isYearly ? 365 : 30);
      setStep('SUCCESS');
      toast.success(res.message || 'Kích hoạt thử nghiệm thành công!');
      onRefreshStatus();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi kích hoạt dùng thử.');
    } finally {
      setIsDemoUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[660px] max-h-[92vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {step === 'PAYMENT' ? (
              <button
                type="button"
                onClick={() => setStep('PLANS')}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer"
                title="Quay lại chọn gói"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Crown size={20} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {step === 'PAYMENT'
                    ? 'Thanh Toán Quét Mã VietQR'
                    : step === 'SUCCESS'
                    ? 'Nâng Cấp Thành Công!'
                    : 'Gói Hội Viên Gia Phả Số'}
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
                {step === 'PAYMENT'
                  ? 'Quét mã VietQR bằng bất kỳ ứng dụng ngân hàng nào (Kích hoạt tức thì 24/7)'
                  : 'Nâng tầm quản lý dòng họ với không gian lưu trữ không giới hạn'}
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
          {/* STEP 1: PLAN SELECTION */}
          {step === 'PLANS' && (
            <>
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

              {/* Pricing Cycle Toggle */}
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
                      <li className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>Tải ảnh gia phả tiêu chuẩn (HD)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <div className="w-full py-2 rounded-xl bg-slate-800/80 text-center text-slate-400 font-semibold text-xs cursor-default">
                      {isPro ? 'Gói Cơ Bản' : 'Gói Hiện Tại'}
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
                      <span className="text-2xl font-black text-white">{amountFormatted}</span>
                      <span className="text-slate-400 text-[10px]">
                        / {isYearly ? 'năm (33k/tháng)' : 'tháng'}
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
                        <span>Xuất ảnh Ultra-HD 4K siêu nét cho in ấn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={13} className="text-amber-400 flex-shrink-0" />
                        <span>Xuất báo cáo & file Excel toàn diện</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={13} className="text-amber-400 flex-shrink-0" />
                        <span>Huy hiệu PRO vàng trên hồ sơ & sơ đồ</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => setStep('PAYMENT')}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Zap size={14} className="fill-slate-950" />
                      <span>{isPro ? 'Gia Hạn Gói PRO' : 'Nâng Cấp PRO Ngay'}</span>
                    </button>
                    <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <span>Quét VietQR SePay tự động kích hoạt tức thì</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: SEPAY VIETQR PAYMENT */}
          {step === 'PAYMENT' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Left: QR Code Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-lg border border-slate-700/60 text-slate-900">
                  <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                    {!qrLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
                        <RefreshCw size={24} className="animate-spin text-emerald-600" />
                        <span className="text-[11px] font-medium">Đang tạo mã VietQR...</span>
                      </div>
                    )}
                    <img
                      src={qrUrl}
                      alt="VietQR SePay Payment"
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        qrLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setQrLoaded(true)}
                    />
                  </div>

                  <div className="mt-3 text-center">
                    <div className="font-bold text-xs text-slate-800 flex items-center justify-center gap-1">
                      <Smartphone size={13} className="text-emerald-600" />
                      <span>Quét bằng app Ngân hàng / MoMo</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Hỗ trợ toàn bộ ngân hàng Napas 24/7
                    </div>
                  </div>
                </div>

                {/* Right: Payment Details */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    {/* Bank Name */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400 text-[11px]">Ngân hàng nhận:</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {sepayConfig.bankName} (Quân Đội)
                      </span>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400 text-[11px]">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm tracking-wider">
                          {sepayConfig.bankAccount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sepayConfig.bankAccount, 'Số tài khoản')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Sao chép STK"
                        >
                          {copiedField === 'Số tài khoản' ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Holder */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400 text-[11px]">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-200 text-xs uppercase">
                        {sepayConfig.accountHolder}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400 text-[11px]">Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-300 text-sm">{amountFormatted}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(amount), 'Số tiền')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Sao chép số tiền"
                        >
                          {copiedField === 'Số tiền' ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Transfer Content (MEMO) - Crucial */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                          <AlertCircle size={11} />
                          Nội dung chuyển khoản (bắt buộc):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
                          className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition"
                        >
                          {copiedField === 'Nội dung chuyển khoản' ? (
                            <>
                              <Check size={11} />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono font-black text-base text-white tracking-wide bg-slate-900/90 py-1.5 px-2.5 rounded-lg border border-amber-500/40 text-center select-all">
                        {transferMemo}
                      </div>
                      <p className="text-[10px] text-amber-200/80 mt-1.5 text-center leading-relaxed">
                        ⚠️ Quý khách vui lòng giữ nguyên nội dung này để hệ thống SePay nhận diện và nâng cấp gói PRO ngay sau 3-5 giây.
                      </p>
                    </div>
                  </div>

                  {/* Pulsing auto-status radar */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] text-emerald-300 font-medium">
                        Đang chờ tín hiệu chuyển khoản từ ngân hàng...
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isCheckingPayment}
                      onClick={handleManualCheck}
                      className="text-[11px] text-slate-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={isCheckingPayment ? 'animate-spin' : ''} />
                      <span>Kiểm tra lại</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('PLANS')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowLeft size={13} />
                  <span>Đổi gói cước khác</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isCheckingPayment}
                    onClick={handleManualCheck}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 size={13} />
                    <span>Tôi Đã Chuyển Khoản</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDemoUpgrading}
                    onClick={handleDemoUpgrade}
                    className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300/80 hover:text-amber-200 border border-amber-500/30 text-[10px] font-semibold transition"
                    title="Kích hoạt tức thì để kiểm thử tính năng (Dành cho admin / demo)"
                  >
                    {isDemoUpgrading ? 'Đang kích hoạt...' : 'Dùng thử ngay'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CELEBRATION */}
          {step === 'SUCCESS' && (
            <div className="py-8 px-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 className="text-xl font-black text-white flex items-center justify-center gap-2">
                  <span>Chúc Mừng Bạn Đã Nâng Cấp PRO!</span>
                  <Crown size={20} className="text-amber-400 fill-amber-400" />
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Toàn bộ các nhánh gia phả bị khóa đã được mở. Bạn hiện có thể tạo không giới hạn nhánh, xuất file Excel toàn diện và tải ảnh Ultra-HD siêu nét.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/30 max-w-sm mx-auto text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <Sparkles size={14} />
                <span>Thời hạn gói: {isYearly ? '1 Năm (365 ngày)' : '1 Tháng (30 ngày)'}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition"
                >
                  Bắt Đầu Trải Nghiệm Ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
