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
      className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3 bg-[#070e09]/95 border-t border-[#273f2b] backdrop-blur-md shadow-2xl text-slate-200 animate-slideUp"
      style={{
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.85), 0 0 20px rgba(104, 239, 63, 0.08)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-4">
        {/* Left: Message & Regulation Compliance */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#122314] text-[#68ef3f] border border-[#273f2b] flex items-center justify-center shrink-0">
            <Cookie size={15} />
          </div>

          <div className="text-xs leading-tight sm:leading-relaxed space-y-0.5">
            <div className="font-bold text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[11px] sm:text-sm">Bảo vệ riêng tư & Cookie</span>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#122314] text-[#68ef3f] border border-[#273f2b] font-medium">
                {region === 'VN'
                  ? 'NĐ 13/2023'
                  : region === 'EU'
                  ? 'GDPR'
                  : region === 'US'
                  ? 'CCPA'
                  : 'Bảo mật Quốc tế'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              Famlykin chỉ dùng Cookie thiết yếu bảo mật. Toàn bộ cookie theo dõi bị chặn mặc định.
            </p>

            <div className="hidden sm:flex items-center gap-2 pt-0.5 text-[10px] sm:text-[11px]">
              <button
                type="button"
                onClick={() => onOpenLegalDocs?.('COOKIE')}
                className="text-[#68ef3f] hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#68ef3f]"
              >
                <span>Chính sách Cookie</span>
                <ExternalLink size={10} />
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegalDocs?.('PRIVACY')}
                className="text-[#68ef3f] hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#68ef3f]"
              >
                <span>Chính sách bảo mật</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end shrink-0 pt-0.5 md:pt-0">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold text-slate-300 hover:text-white bg-[#122314] hover:bg-[#1a331d] border border-[#273f2b] flex items-center gap-1 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
          >
            <Settings size={12} />
            <span>Tùy Chỉnh</span>
          </button>

          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold text-slate-200 bg-[#122314] hover:bg-[#1a331d] border border-[#273f2b] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
          >
            Chỉ Cần Thiết
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-md shadow-[#68ef3f]/20 transition-all cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
          >
            <Check size={13} className="stroke-[2.5]" />
            <span>Đồng Ý</span>
          </button>
        </div>
      </div>

      {/* Customize Panel Drawer */}
      {showCustomize && (
        <div className="max-w-5xl mx-auto mt-2.5 pt-2.5 border-t border-[#273f2b] text-xs grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0b160f] border border-[#273f2b] flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                <ShieldCheck size={14} className="text-[#68ef3f]" />
                <span>1. Cookie Thiết Yếu (Bắt Buộc)</span>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
                Duy trì đăng nhập an toàn, lưu cây phả hệ, chống CSRF. Không thể tắt.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#122314] text-[#68ef3f] font-semibold border border-[#273f2b] shrink-0">
              Luôn Bật
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0b160f] border border-[#273f2b] flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Cookie size={14} className="text-cyan-400" />
                <span>2. Cookie Đo Lường & Phân Tích (Analytics)</span>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
                Giúp tối ưu tốc độ tải cây gia phả. Thông tin IP được ẩn danh hoàn toàn.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analyticsAllowed}
              onChange={(e) => setAnalyticsAllowed(e.target.checked)}
              className="w-4 h-4 accent-[#68ef3f] cursor-pointer shrink-0 mt-1"
              aria-label="Bật/Tắt Cookie Đo Lường"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#68ef3f] hover:bg-[#58dc31] text-[#122314] transition-all cursor-pointer"
            >
              Lưu Cài Đặt Của Tôi
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
