import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Copy,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { User, SubscriptionStatus } from '../types';
import {
  apiGetSubscriptionStatus,
  apiCreateSubscriptionOrder,
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  
  // 10-Minute AFK Countdown Timer (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);

  // Order Details from Server (e.g. PRO #1)
  const [orderDetails, setOrderDetails] = useState<{
    orderCode: number;
    orderNumber: string; // e.g. "PRO #1"
    transferMemo: string;
    amount: number;
    bankAccount: string;
    bankName: string;
    accountHolder: string;
  }>({
    orderCode: 1,
    orderNumber: 'PRO #1',
    transferMemo: 'PRO #1',
    amount: 399000,
    bankAccount: '2911121319',
    bankName: 'MBBank',
    accountHolder: 'NGUYEN HOANG ANH KHOI',
  });

  const toast = useToast();
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('PLANS');
      setQrLoaded(false);
      setTimeLeft(600);
    }
  }, [isOpen]);

  // Handle plan transition into PAYMENT step
  const handleProceedToPayment = async () => {
    try {
      setQrLoaded(false);
      setTimeLeft(600); // 10 minutes timeout
      const order = await apiCreateSubscriptionOrder(billingCycle);
      if (order) {
        setOrderDetails({
          orderCode: order.orderCode,
          orderNumber: order.orderNumber,
          transferMemo: order.transferMemo || order.orderNumber,
          amount: order.amount,
          bankAccount: order.bankAccount || '2911121319',
          bankName: order.bankName || 'MBBank',
          accountHolder: 'NGUYEN HOANG ANH KHOI',
        });
      }
      setStep('PAYMENT');
    } catch (err: any) {
      // Fallback local code if offline
      const fallbackAmount = billingCycle === 'YEARLY' ? 399000 : 49000;
      setOrderDetails({
        orderCode: 1,
        orderNumber: 'PRO #1',
        transferMemo: 'PRO #1',
        amount: fallbackAmount,
        bankAccount: '2911121319',
        bankName: 'MBBank',
        accountHolder: 'NGUYEN HOANG ANH KHOI',
      });
      setStep('PAYMENT');
    }
  };

  // SePay VietQR Image URL (Format: bank account, bank name, amount, description)
  // For QR standard compatibility, passing 'PRO <orderCode>' in QR link
  const qrUrl = `https://qr.sepay.vn/img?acc=${orderDetails.bankAccount}&bank=${
    orderDetails.bankName
  }&amount=${orderDetails.amount}&des=${encodeURIComponent(
    `PRO ${orderDetails.orderCode}`
  )}`;

  const amountFormatted = orderDetails.amount.toLocaleString('vi-VN') + 'đ';

  // 10-Minute AFK Countdown Timer
  useEffect(() => {
    if (!isOpen || step !== 'PAYMENT') {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          toast.info('Phiên giao dịch đã hết hạn 10 phút. Vui lòng bấm nâng cấp lại nếu muốn thanh toán.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, step, onClose, toast]);

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

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="relative w-full max-w-[620px] max-h-[88dvh] sm:max-h-[90vh] bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            {step === 'PAYMENT' ? (
              <button
                type="button"
                onClick={() => setStep('PLANS')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                title="Quay lại chọn gói"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
                <Crown size={18} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {step === 'PAYMENT'
                    ? 'Thanh Toán Quét Mã VietQR'
                    : step === 'SUCCESS'
                    ? 'Nâng Cấp Thành Công!'
                    : 'Gói Hội Viên Gia Phả Số'}
                </h3>
                {isPro ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                    PRO
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                    Miễn Phí
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {step === 'PAYMENT'
                  ? 'Quét mã VietQR bằng bất kỳ ứng dụng ngân hàng nào (24/7)'
                  : 'Nâng tầm quản lý dòng họ với không gian lưu trữ không giới hạn'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto min-h-0 flex-1 space-y-3.5 sm:space-y-4 text-xs">
          {/* STEP 1: PLAN SELECTION (Đã giải phóng không gian trên, không hiển thị số nhánh) */}
          {step === 'PLANS' && (
            <>
              {/* Pricing Cycle Toggle */}
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 max-w-[260px] mx-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`flex-1 py-1.5 rounded-lg transition whitespace-nowrap ${
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
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 whitespace-nowrap ${
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

              {/* Comparison Cards Grid (On mobile: PRO is shown first with priority) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                {/* PRO Plan (order-1 on mobile so user sees upgrade right away) */}
                <div className="order-1 sm:order-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-slate-950 to-slate-950 border-2 border-amber-500/50 shadow-lg shadow-amber-950/30 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase whitespace-nowrap">
                    <Sparkles size={10} />
                    <span>Khuyên dùng</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Crown size={15} className="text-amber-400" />
                      <span className="font-bold text-sm text-amber-300 whitespace-nowrap">Gói PRO</span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-xl sm:text-2xl font-black text-white whitespace-nowrap">
                        {billingCycle === 'YEARLY' ? '399.000đ' : '49.000đ'}
                      </span>
                      <span className="text-slate-400 text-[10px] whitespace-nowrap">
                        / {billingCycle === 'YEARLY' ? 'năm (33k/tháng)' : 'tháng'}
                      </span>
                    </div>

                    <ul className="space-y-1.5 sm:space-y-2 text-slate-300 text-[11px]">
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

                  {/* Nút Nâng cấp PRO ngay */}
                  <div className="pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      className="w-full h-10 sm:h-11 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center transition cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    >
                      <span>{isPro ? 'Gia Hạn Gói PRO' : 'Nâng Cấp PRO Ngay'}</span>
                    </button>
                  </div>
                </div>

                {/* Free Plan (order-2 on mobile) */}
                <div className="order-2 sm:order-1 p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-200 whitespace-nowrap">Gói Miễn Phí</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 whitespace-nowrap">
                        Mặc định
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-white mb-2.5">0đ</div>
                    <ul className="space-y-1.5 sm:space-y-2 text-slate-400 text-[11px]">
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

                  <div className="pt-3 sm:pt-4">
                    <div className="w-full h-10 sm:h-11 rounded-xl bg-slate-800/80 text-center text-slate-400 font-semibold text-xs cursor-default flex items-center justify-center whitespace-nowrap">
                      {isPro ? 'Gói Cơ Bản' : 'Gói Hiện Tại'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: SEPAY VIETQR PAYMENT (Đã tối ưu theo hình 2) */}
          {step === 'PAYMENT' && (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                {/* Left: QR Code Card (Gọn gàng, bỏ text quét bằng app ngân hàng / napas) */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-lg border border-slate-700/60 text-slate-900">
                  <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
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
                  {/* Countdown Timer Badge */}
                  <div className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    <Clock size={12} className="text-amber-600" />
                    <span>Hết hạn: <strong className="font-mono text-amber-700">{formatCountdown(timeLeft)}</strong></span>
                  </div>
                </div>

                {/* Right: Payment Details */}
                <div className="sm:col-span-7 space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    {/* Bank Name */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 whitespace-nowrap">Ngân hàng nhận:</span>
                      <span className="font-bold text-emerald-400 whitespace-nowrap">
                        {orderDetails.bankName} (Quân Đội)
                      </span>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 whitespace-nowrap">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm tracking-wider font-mono">
                          {orderDetails.bankAccount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(orderDetails.bankAccount, 'Số tài khoản')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
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

                    {/* Account Holder: NGUYEN HOANG ANH KHOI */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 whitespace-nowrap">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-200 text-xs uppercase tracking-wide whitespace-nowrap">
                        {orderDetails.accountHolder}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400 whitespace-nowrap">Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-300 text-sm whitespace-nowrap">{amountFormatted}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(orderDetails.amount), 'Số tiền')}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
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

                    {/* Transfer Content (MEMO): Format chuẩn PRO #1 */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="font-bold text-amber-300 uppercase tracking-tight whitespace-nowrap">
                          NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(orderDetails.transferMemo, 'Nội dung chuyển khoản')}
                          className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
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
                      <div className="font-mono font-black text-base text-white tracking-widest bg-slate-900/90 py-1.5 px-2 rounded-lg border border-amber-500/40 text-center select-all">
                        {orderDetails.transferMemo}
                      </div>
                    </div>
                  </div>

                  {/* Hàng trạng thái: Nằm chung 1 hàng, không xuống dòng */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-row items-center justify-between gap-2 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] text-emerald-300 font-medium truncate">
                        Đang chờ tín hiệu từ ngân hàng...
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isCheckingPayment}
                      onClick={handleManualCheck}
                      className="flex-shrink-0 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 transition cursor-pointer"
                    >
                      <RefreshCw size={11} className={isCheckingPayment ? 'animate-spin' : ''} />
                      <span>Kiểm tra lại</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Nút Tôi Đã Chuyển Khoản căn giữa trang trọng, bỏ các nút thừa */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-center">
                <button
                  type="button"
                  disabled={isCheckingPayment}
                  onClick={handleManualCheck}
                  className="w-full sm:w-auto min-w-[220px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 size={14} />
                  <span>Tôi Đã Chuyển Khoản</span>
                </button>
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
                <span>Thời hạn gói: {billingCycle === 'YEARLY' ? '1 Năm (365 ngày)' : '1 Tháng (30 ngày)'}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition cursor-pointer"
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
