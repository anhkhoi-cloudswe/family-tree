import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings, Check, X, ExternalLink } from 'lucide-react';
import {
  getStoredCookieConsent,
  getStoredCookiePreferences,
  saveCookieConsent,
  CookiePreferences,
  detectUserRegion,
} from '../utils/cookieConsent';

interface CookieConsentBannerProps {
  onOpenLegalDocs?: (tab: 'PRIVACY' | 'COOKIE') => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenLegalDocs }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(false);
  const region = detectUserRegion();

  useEffect(() => {
    // Kiểm tra xem đã có sự đồng ý trước đó chưa
    const consent = getStoredCookieConsent();
    if (!consent) {
      // Chưa từng đồng ý hoặc từ chối -> hiển thị banner
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    saveCookieConsent('ACCEPTED', { analytics: true, marketing: true });
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    saveCookieConsent('ESSENTIAL_ONLY', { analytics: false, marketing: false });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent(analyticsAllowed ? 'ACCEPTED' : 'ESSENTIAL_ONLY', {
      analytics: analyticsAllowed,
      marketing: false,
    });
    setIsVisible(false);
  };

  return (
    <aside
      aria-label="Thông báo và tùy chọn Cookie"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-slate-950/95 border-t border-emerald-500/30 backdrop-blur-lg shadow-2xl text-slate-200 animate-slideUp"
      style={{
        boxShadow: '0 -15px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.1)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Message & Regulation Compliance */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie size={19} />
          </div>

          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Bảo vệ quyền riêng tư & Cookie gia phả</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                {region === 'VN'
                  ? 'Nghị định 13/2023/NĐ-CP'
                  : region === 'EU'
                  ? 'Tuân thủ GDPR'
                  : region === 'US'
                  ? 'Tuân thủ CCPA'
                  : 'Bảo mật Quốc tế'}
              </span>
            </div>
            <p className="text-slate-300">
              Famlykin cam kết <strong>chặn toàn bộ cookie theo dõi (Google Analytics, Pixel)</strong> cho đến khi bạn đồng ý. 
              Chúng tôi chỉ sử dụng Cookie thiết yếu để duy trì phiên đăng nhập bảo mật và vẽ sơ đồ cây.
            </p>

            <div className="flex items-center gap-2 pt-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => onOpenLegalDocs?.('COOKIE')}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>Chính sách Cookie riêng biệt</span>
                <ExternalLink size={10} />
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegalDocs?.('PRIVACY')}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>Chính sách bảo mật dữ liệu</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings size={13} />
            <span>Tùy Chỉnh</span>
          </button>

          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all cursor-pointer"
          >
            Chỉ Cookie Cần Thiết
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Đồng Ý Tất Cả</span>
          </button>
        </div>
      </div>

      {/* Customize Panel Drawer */}
      {showCustomize && (
        <div className="max-w-5xl mx-auto mt-3 pt-3 border-t border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>1. Cookie Thiết Yếu (Bắt Buộc)</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Duy trì đăng nhập an toàn, lưu cây phả hệ, chống CSRF. Không thể tắt.
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shrink-0">
              Luôn Bật
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Cookie size={14} className="text-cyan-400" />
                <span>2. Cookie Đo Lường & Phân Tích (Analytics)</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Giúp tối ưu tốc độ tải cây gia phả. Thông tin IP được ẩn danh hoàn toàn.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsAllowed}
              onChange={(e) => setAnalyticsAllowed(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0 mt-1"
              aria-label="Bật/Tắt Cookie Đo Lường"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
            >
              Lưu Cài Đặt Của Tôi
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
