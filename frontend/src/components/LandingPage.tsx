import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TreePine,
  Calendar,
  Calculator,
  Award,
  ShieldCheck,
  Download,
  Users,
  ChevronRight,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  HeartHandshake,
  FileCheck,
  Scale,
  Menu,
  X,
  Share2,
  Network,
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';
import heroBgWebp from '../assets/hero-bg1.webp';
import footerBgWebp from '../assets/footer-bg.webp';

interface LandingPageProps {
  onStartDemo: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenLegalDocs: (tab: 'PRIVACY' | 'TERMS' | 'COOKIE' | 'REFUND') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDemo,
  onOpenLogin,
  onOpenRegister,
  onOpenLegalDocs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Phát hiện thiết lập giảm chuyển động của hệ điều hành
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const closeMobileMenu = () => {
    if (prefersReducedMotion) {
      setMobileMenuOpen(false);
      return;
    }
    setIsMenuClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsMenuClosing(false);
    }, 220);
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMenuClosing(false);
      setMobileMenuOpen(true);
    }
  };

  // Lắng nghe sự kiện scroll trên cả window và container .landing-guest-wrapper
  useEffect(() => {
    let animId: number;
    const handleScroll = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(() => {
        const wrapper = document.querySelector('.landing-guest-wrapper');
        const currentScrollY = wrapper ? wrapper.scrollTop : window.pageYOffset || document.documentElement.scrollTop;
        setScrollY(currentScrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    const wrapper = document.querySelector('.landing-guest-wrapper');
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
      if (wrapper) {
        wrapper.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Khóa cuộn trang nền khi mở mobile drawer
  useEffect(() => {
    const wrapper = document.querySelector('.landing-guest-wrapper') as HTMLElement | null;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      if (wrapper) wrapper.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (wrapper) wrapper.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (wrapper) wrapper.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    closeMobileMenu();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  // Tính toán độ mờ nền Hero thiên nhiên theo vị trí cuộn trang (Fade-out sau nút CTA)
  // Khi cuộn từ 0px đến 450px: opacity giảm dần từ 1 xuống 0.05
  const heroBgOpacity = prefersReducedMotion ? 1 : Math.max(0.08, 1 - scrollY / 420);
  const heroParallaxOffset = prefersReducedMotion ? 0 : scrollY * 0.25; // Parallax dịch chuyển nhẹ (tắt khi reduced motion)

  return (
    <div className="landing-enter-anim min-h-screen bg-[#070e09] text-slate-100 flex flex-col font-sans selection:bg-[#68ef3f] selection:text-slate-950 overflow-x-hidden">
      {/* 1. Navbar Cao Cấp Phong Cách SaaS Hiện Đại (Tomorro Inspired) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out ${
          mobileMenuOpen
            ? 'bg-[#070e09] border-b border-[#273f2b]'
            : scrollY > 20
            ? 'backdrop-blur-md bg-[#0b160f]/90 border-b border-[#273f2b]/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'bg-transparent border-b border-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 grid grid-cols-2 md:grid-cols-3 items-center">
          {/* Cột Trái: Logo Famlykin */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              className="flex items-center gap-3 cursor-pointer group rounded-xl p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
              aria-label="Về đầu trang chủ Famlykin"
              onClick={() => {
                if (mobileMenuOpen) closeMobileMenu();
                const wrapper = document.querySelector('.landing-guest-wrapper');
                if (wrapper) wrapper.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
              }}
            >
              <div className="transition-transform duration-300 group-hover:scale-105">
                <FamilyTreeLogo size={36} />
              </div>
              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-bold font-serif tracking-wider text-white group-hover:text-[#68ef3f] transition-colors">
                  Famlykin
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] px-2.5 py-0.5 rounded-full bg-[#122314] text-[#68ef3f] border border-[#273f2b] font-medium">
                  Gia Phả Số Hóa
                </span>
              </div>
            </button>
          </div>

          {/* Cột Giữa (Desktop): Canh giữa chính xác tuyệt đối với Slogan & Hero text bên dưới */}
          <div className="hidden md:flex items-center justify-center">
            <nav className="inline-flex items-center gap-1 lg:gap-2 px-3 py-1.5 rounded-full bg-[#122314]/80 border border-[#273f2b] backdrop-blur-md shadow-sm">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer whitespace-nowrap"
              >
                Tính Năng
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('pricing')}
                className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer whitespace-nowrap"
              >
                Bảng Giá
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenLegalDocs('PRIVACY');
                }}
                className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer whitespace-nowrap"
              >
                Chính Sách
              </button>
            </nav>
          </div>

          {/* Cột Phải: Nút Đăng Nhập (Desktop) & Hamburger (Mobile) */}
          <div className="flex items-center justify-end">
            <div className="hidden md:flex items-center">
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_20px_rgba(104,239,63,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <span>Đăng Nhập</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Mobile Hamburger Button (< 768px) */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="w-10 h-10 rounded-full flex flex-col items-center justify-center bg-[#122314] border border-[#273f2b] text-white hover:text-[#68ef3f] transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070e09] relative overflow-hidden"
                aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              >
                <span
                  className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out transform ${
                    mobileMenuOpen ? 'rotate-45 translate-y-[3.5px]' : '-translate-y-[3px]'
                  }`}
                />
                <span
                  className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out transform ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-[3.5px]' : 'translate-y-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Trượt xuống bên dưới Header top-16 sm:top-20, giữ nguyên Header và Logo) */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden fixed inset-x-0 top-16 sm:top-20 bottom-0 z-40 bg-[#070e09] flex flex-col justify-between px-6 py-6 overflow-y-auto border-t border-[#273f2b] ${
            isMenuClosing ? 'animate-drawer-slide-up' : 'animate-drawer-slide-down'
          }`}
          style={{ height: 'calc(100dvh - 4rem)' }}
        >
          <div className="flex flex-col space-y-3 mt-4 w-full">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="drawer-stagger-1 w-full text-left py-4 px-5 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
            >
              <span>🌿 Tính Năng Cốt Lõi</span>
              <ChevronRight size={18} className="text-[#68ef3f]" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="drawer-stagger-2 w-full text-left py-4 px-5 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
            >
              <span>💎 Bảng Giá Hội Viên</span>
              <ChevronRight size={18} className="text-[#68ef3f]" />
            </button>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                onOpenLegalDocs('PRIVACY');
              }}
              className="drawer-stagger-3 w-full text-left py-4 px-5 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
            >
              <span>🛡️ Chính Sách Bảo Mật (NĐ 13)</span>
              <ChevronRight size={18} className="text-[#68ef3f]" />
            </button>
          </div>

          <div className="drawer-stagger-4 pt-4 border-t border-[#273f2b] flex flex-col space-y-3 shrink-0 w-full pb-6">
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                onOpenLogin();
              }}
              className="w-full py-4 rounded-full text-base font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_25px_rgba(104,239,63,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68ef3f]"
            >
              <span>Đăng Nhập</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero Section Với Nền Thiên Nhiên, Gradient Tinh Tế & Scroll Fade-Out */}
      <section className="relative pt-16 sm:pt-36 pb-20 sm:pb-36 px-4 sm:px-6 w-full min-h-[92svh] sm:min-h-0 flex flex-col justify-between sm:justify-start items-center text-center overflow-visible">
        {/* Lớp Ảnh Thiên Nhiên Phong Cảnh Đồi Chè (WebP siêu nhẹ + fallback PNG) - Neo cố định top center để thấy trọn khinh khí cầu và mặt trời */}
        <div
          className="absolute inset-x-0 -top-20 sm:-top-32 h-[880px] sm:h-[1100px] pointer-events-none -z-20 overflow-hidden w-full"
          style={{
            opacity: Math.max(0, 1 - scrollY / 460),
            transition: 'opacity 0.25s ease-out',
          }}
        >
          <div
            className="w-full h-full bg-no-repeat transition-transform duration-100 ease-out brightness-110 contrast-105"
            style={{
              backgroundImage: `url(${heroBgWebp})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              transform: `translateY(${heroParallaxOffset}px)`,
            }}
          />
        </div>

        {/* Lớp Phủ Gradient Chuẩn: Tăng cường độ phủ tối ở phần giữa để tiêu đề chữ trắng nổi bật tuyệt đối */}
        <div
          className="absolute inset-x-0 -top-20 sm:-top-32 h-[880px] sm:h-[1100px] pointer-events-none -z-10 bg-gradient-to-b from-black/40 via-black/65 via-45% to-[#070e09] w-full"
          style={{
            opacity: Math.max(0, 1 - scrollY / 460),
            transition: 'opacity 0.25s ease-out',
          }}
        />

        {/* Neon Botanical Glow Atmosphere Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[680px] h-[350px] sm:h-[680px] bg-[#68ef3f]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Nội dung chính Hero: Slogan, H1, Description, CTA Buttons */}
        <div className="w-full flex flex-col items-center flex-1 justify-center max-w-4xl pt-6 sm:pt-0">
          {/* Slogan nhỏ (Bỏ icon sao trước chữ) */}
          <div className="hero-fade-1 inline-flex items-center px-4 py-1 rounded-full bg-[#122314]/90 border border-[#273f2b] text-[#68ef3f] text-xs sm:text-sm font-semibold mb-3 sm:mb-6 shadow-lg backdrop-blur-md">
            <span>Lưu truyền gốc rễ • Kết nối trăm năm</span>
          </div>

          {/* Tiêu đề chính (H1) - Hiển thị 2 dòng: "Gìn Giữ Cội Nguồn •" và xuống dòng "Kết Nối Dòng Tộc" trên cả desktop và mobile */}
          <h1 className="hero-fade-2 text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-[1.35] sm:leading-[1.3] drop-shadow-md px-2 py-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e2e8d8] to-[#68ef3f] drop-shadow-[0_0_40px_rgba(104,239,63,0.35)] block py-1">
              Gìn Giữ Cội Nguồn •
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d9deca] via-white to-[#68ef3f] drop-shadow-[0_0_40px_rgba(104,239,63,0.35)] block py-1 mt-1">
              Kết Nối Dòng Tộc
            </span>
          </h1>

          {/* Mô tả ngắn gọn (1 dòng) - Tương phản cao, drop-shadow rõ ràng trên nền tối */}
          <p className="hero-fade-3 mt-4 sm:mt-5 text-sm sm:text-lg text-slate-200 max-w-3xl leading-relaxed font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] px-2">
            Nền tảng phả hệ thông minh Việt Nam tích hợp <strong className="text-[#68ef3f] font-semibold">Lịch Giỗ Âm - Dương thông minh</strong>, bàn tính xưng hô và kết nối dòng tộc.
          </p>

          {/* CTA Buttons (Responsive Full-width trên mobile, hàng ngang trên desktop, padding ngón tay chuẩn UX) */}
          <div className="hero-fade-4 mt-6 sm:mt-10 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none px-2 sm:px-0 z-10">
            <button
              type="button"
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-7 sm:px-10 py-3.5 sm:py-4 rounded-full text-base sm:text-lg font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_35px_rgba(104,239,63,0.45)] transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap min-h-[48px]"
            >
              <span>Bắt Đầu Miễn Phí Ngay</span>
              <ChevronRight size={20} className="stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onStartDemo}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold text-[#f2f5eb] bg-[#122314]/90 hover:bg-[#1a331d] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-md backdrop-blur-md min-h-[48px]"
            >
              <TreePine size={18} className="text-[#68ef3f]" />
              <span>Khám Phá Cây Mẫu Trải Nghiệm</span>
            </button>
          </div>
        </div>

        {/* Hero Interactive App Mockup Preview - Trọn vẹn trong container kính mờ bo góc cao cấp, không bị cắt lửng lơ
            Trên mobile (dưới md): đặt mt-20 để màn hình đầu tiên (1st screen view) hiển thị trọn vẹn phong cảnh đồi chè và 2 nút CTA mà không bị lấn/dính khung mockup! */}
        <div className="hero-fade-5 mt-20 sm:mt-24 w-full max-w-5xl [perspective:1400px] z-10 px-2 sm:px-4">
          <div className="rounded-3xl p-2.5 sm:p-4 bg-gradient-to-b from-[#1a331d]/70 via-[#122314]/60 to-[#0a140b]/90 border border-[#273f2b]/90 backdrop-blur-md shadow-[0_25px_70px_rgba(0,0,0,0.85),_0_0_45px_rgba(104,239,63,0.12)] transform transition-transform duration-500 hover:[transform:none] sm:[transform:rotateX(4deg)_rotateY(-2deg)]">
            <div className="rounded-2xl overflow-hidden bg-[#0a140b] border border-[#273f2b] relative shadow-inner">
              {/* Mockup browser bar */}
              <div className="h-10 bg-[#122314] px-4 flex items-center gap-2 border-b border-[#273f2b]">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-[#68ef3f]/90" />
                <div className="mx-auto px-4 py-1 rounded-md bg-[#0a140b] text-[11px] text-[#b7bda5] border border-[#273f2b] font-mono">
                  https://famlykin.io.vn/tree
                </div>
              </div>

              {/* Tree Canvas Preview Card Graphic */}
              <div className="p-5 sm:p-12 relative flex flex-col items-center justify-center min-h-[320px] sm:min-h-[420px] bg-gradient-to-b from-[#0e1c10] to-[#081209]">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(104, 239, 63, 0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {/* Level 1: Ancestor */}
                <div className="flex flex-col items-center z-10 w-full max-w-2xl">
                  <div className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_25px_rgba(104,239,63,0.25)] flex items-center gap-3 sm:gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#68ef3f]/20 text-[#68ef3f] font-bold flex items-center justify-center text-sm border border-[#68ef3f]/40">
                      NV
                    </div>
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <span>Nguyễn Văn Cụ</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#68ef3f]/20 text-[#68ef3f] font-semibold border border-[#68ef3f]/30">Đời 1</span>
                      </div>
                      <div className="text-xs text-rose-300 flex items-center gap-1 mt-0.5 font-medium">
                        <Flame size={12} className="text-rose-400" />
                        <span>Giỗ Âm: 15/07 Âm lịch</span>
                      </div>
                    </div>
                  </div>

                  {/* CÂY GIA PHẢ - DESKTOP VIEW: Kẻ từ Cụ xuống và nối cả 3 người con ngang hàng */}
                  <div className="hidden sm:flex flex-col items-center w-full">
                    {/* Trục dọc từ Cụ xuống */}
                    <div className="w-0.5 h-6 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.6)]" />
                    {/* Thanh ngang tỏa sang 3 nhánh con */}
                    <div className="w-[78%] h-0.5 bg-[#68ef3f] relative shadow-[0_0_8px_rgba(104,239,63,0.6)]">
                      {/* Nhánh con trái (Bác ruột) */}
                      <div className="absolute left-0 top-0 w-0.5 h-6 bg-[#68ef3f]" />
                      {/* Nhánh con giữa (Bố ruột) */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 h-6 bg-[#68ef3f]" />
                      {/* Nhánh con phải (Cô ruột) */}
                      <div className="absolute right-0 top-0 w-0.5 h-6 bg-[#68ef3f]" />
                    </div>
                    {/* Khoảng cách xuống thẻ con */}
                    <div className="h-6" />

                    {/* 3 người con ngang hàng */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                          NA
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Nguyễn Văn Anh</div>
                          <div className="text-[11px] text-[#68ef3f] font-semibold">Bác ruột (Đời 2)</div>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 rounded-xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_20px_rgba(104,239,63,0.2)] flex items-center gap-2.5 justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#68ef3f]/25 text-[#68ef3f] font-semibold flex items-center justify-center text-xs border border-[#68ef3f]/40">
                          NB
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Nguyễn Văn Ba</div>
                          <div className="text-[11px] text-[#68ef3f] font-semibold">Bố ruột (Đời 2)</div>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                          NC
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Nguyễn Thị Cúc</div>
                          <div className="text-[11px] text-[#b7bda5] font-semibold">Cô ruột (Đời 2)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CÂY GIA PHẢ - MOBILE VIEW: Bố cục gia phả trực quan, đường rẽ nhánh ngang - dọc rõ ràng, không bị che khuất */}
                  <div className="sm:hidden flex flex-col items-center w-full mt-2">
                    {/* Trục dọc nối từ giữa Cụ xuống */}
                    <div className="w-1 h-5 bg-[#68ef3f] rounded-full shadow-[0_0_10px_rgba(104,239,63,0.8)] z-10" />

                    <div className="relative flex flex-col gap-3 w-full max-w-[270px] pl-6">
                      {/* Trục xương sống dọc bo tròn từ trên đỉnh xuống ngang thẻ thứ 3 */}
                      <div className="absolute left-1.5 top-0 bottom-6 w-1 bg-[#68ef3f] rounded-full shadow-[0_0_10px_rgba(104,239,63,0.8)] z-0" />
                      
                      {/* Cầu nối ngang từ giữa sang trục xương sống bên trái */}
                      <div className="absolute left-1.5 right-1/2 top-0 h-1 bg-[#68ef3f] rounded-full shadow-[0_0_10px_rgba(104,239,63,0.8)] z-0" />

                      {/* Con 1: Bác ruột */}
                      <div className="relative z-10">
                        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-1 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.7)]" />
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                            NA
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">Nguyễn Văn Anh</div>
                            <div className="text-[11px] text-[#68ef3f] font-semibold">Bác ruột (Đời 2)</div>
                          </div>
                        </div>
                      </div>

                      {/* Con 2: Bố ruột */}
                      <div className="relative z-10">
                        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-1 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.7)]" />
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_15px_rgba(104,239,63,0.2)] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#68ef3f]/25 text-[#68ef3f] font-semibold flex items-center justify-center text-xs border border-[#68ef3f]/40">
                            NB
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">Nguyễn Văn Ba</div>
                            <div className="text-[11px] text-[#68ef3f] font-semibold">Bố ruột (Đời 2)</div>
                          </div>
                        </div>
                      </div>

                      {/* Con 3: Cô ruột */}
                      <div className="relative z-10">
                        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-1 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.7)]" />
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                            NC
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">Nguyễn Thị Cúc</div>
                            <div className="text-[11px] text-[#b7bda5] font-semibold">Cô ruột (Đời 2)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight trust badges */}
        <div className="mt-14 pt-8 border-t border-[#273f2b]/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-[#b7bda5]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#68ef3f]" />
            <span>Bảo mật chuẩn Nghị định 13</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#68ef3f]" />
            <span>Thuộc quyền sở hữu 100% của gia đình</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale size={17} className="text-[#68ef3f]" />
            <span>Không thương mại hóa dữ liệu</span>
          </div>
        </div>
      </section>

      {/* 3. Core Features Showcase - Đặc Quyền Bản Sắc Dòng Họ */}
      <section id="features" className="py-20 sm:py-28 bg-[#0a140b] border-y border-[#273f2b] px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#122314] border border-[#273f2b] text-[#68ef3f] text-xs font-semibold mb-4">
              <Sparkles size={13} className="text-[#68ef3f]" />
              <span>Đặc Quyền Bản Sắc Dòng Họ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Được Thiết Kế Tỉ Mỉ Cho Phong Tục Việt
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-[#b7bda5] leading-relaxed">
              Giải quyết trọn vẹn những khó khăn trong việc ghi chép, nhớ lịch giỗ và xưng hô vai vế dòng họ qua giao diện trực quan và bảo mật.
            </p>
          </div>

          {/* 3 Cột Desktop / 1 Cột Mobile với đồ họa biểu trưng trực quan, thẻ bo tròn cao cấp */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {/* Feature 1: Sơ Đồ Phả Hệ */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#0c1a0e] to-[#16301a] border border-emerald-900/50 mb-5 p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#68ef3f]/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#68ef3f]/20 border border-[#68ef3f]/40 text-[#68ef3f] text-[10px] font-bold flex items-center justify-center">Cụ</span>
                    <span className="w-4 h-0.5 bg-[#68ef3f]/60" />
                    <span className="px-2 py-0.5 rounded-full bg-[#1b3820] text-[#68ef3f] text-[10px] font-semibold border border-emerald-800">Đời 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#122314] text-white text-[11px] font-medium border border-[#273f2b]">Nhánh Nội</span>
                    <span className="text-[#68ef3f] text-xs">•</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#122314] text-white text-[11px] font-medium border border-[#273f2b]">Nhánh Ngoại</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center text-[#68ef3f] shrink-0">
                    <TreePine size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Sơ Đồ Phả Hệ Động
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Bố trí nhánh Nội - Ngoại thông minh, đổi góc nhìn từng thành viên chỉ với một chạm mượt mà.
                </p>
              </div>
            </div>

            {/* Feature 2: Lịch Giỗ Âm Dương */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#1a0f0f] to-[#2d1515] border border-rose-950/60 mb-5 p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-rose-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold mb-1.5">
                    <Flame size={14} className="text-rose-400" />
                    <span>Giỗ Cụ Tổ 15/07 Âm Lịch</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    <span>Dương lịch: 28/08 • Còn 4 ngày</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2d1515] border border-rose-900/60 flex items-center justify-center text-rose-400 shrink-0">
                    <Flame size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Lịch Giỗ Âm - Dương
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tự đổi ngày giỗ Âm sang Dương từng năm, đếm ngược và nhắc con cháu chuẩn bị chu đáo.
                </p>
              </div>
            </div>

            {/* Feature 3: Bàn Tính Xưng Hô */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#1a170a] to-[#2e2610] border border-amber-950/60 mb-5 p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-200 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300">Tôi</span>
                    <span className="text-amber-400">↔</span>
                    <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300">Con Bác Cả</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-bold border border-amber-500/30">
                    Xưng: "Anh Họ" / Gọi: "Em"
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2e2610] border border-amber-900/60 flex items-center justify-center text-amber-400 shrink-0">
                    <Calculator size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Bàn Tính Vai Vế
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tra cứu xưng hô chuẩn thuần phong mỹ tục dòng họ Việt chỉ bằng việc chọn 2 người bất kỳ.
                </p>
              </div>
            </div>

            {/* Feature 4: Trắc Nghiệm Phả Hệ */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#0f111e] to-[#1a1f38] border border-indigo-950/60 mb-5 p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                  <div className="text-[11px] text-indigo-300 font-medium mb-1.5">Đố vui dòng họ (Flashcard)</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">Thử Thách Cội Nguồn</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1a1f38] border border-indigo-900/60 flex items-center justify-center text-indigo-400 shrink-0">
                    <Award size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Trắc Nghiệm Phả Hệ
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Đố vui tương tác giúp thế hệ trẻ dễ nhớ mặt người thân và nguồn cội tổ tiên ngày sum vầy.
                </p>
              </div>
            </div>

            {/* Feature 5: Xuất File Excel / Ảnh */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#0c1816] to-[#122b27] border border-teal-950/60 mb-5 p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:border-teal-500/30 transition-colors">
                  <div className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 flex items-center gap-1.5">
                    <Download size={13} />
                    <span>In Ảnh 4K</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 flex items-center gap-1.5">
                    <Download size={13} />
                    <span>Xuất Excel</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#122b27] border border-teal-900/60 flex items-center justify-center text-teal-300 shrink-0">
                    <Download size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Xuất File Excel & Ảnh 4K
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tải ảnh sơ đồ siêu nét in tranh thờ treo nhà thờ họ, hoặc lưu offline toàn bộ gia phả ra Excel.
                </p>
              </div>
            </div>

            {/* Feature 6: Cộng Tác Thời Gian Thực */}
            <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-md bg-[#122314]/75 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/90 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                {/* Visual Graphic Badge */}
                <div className="h-28 rounded-2xl bg-gradient-to-br from-[#0d1a0e] to-[#17331b] border border-emerald-900/50 mb-5 p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#68ef3f]/30 transition-colors">
                  <div className="flex items-center -space-x-2 mb-1.5">
                    <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#122314]">TT</span>
                    <span className="w-7 h-7 rounded-full bg-teal-700 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#122314]">BC</span>
                    <span className="w-7 h-7 rounded-full bg-amber-700 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#122314]">CC</span>
                  </div>
                  <div className="text-[11px] text-[#68ef3f] font-semibold">Trưởng Tộc • Đóng Góp • Khách Xem</div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center text-[#68ef3f] shrink-0">
                    <Users size={18} className="stroke-[2.2]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Cộng Tác Dòng Họ
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Mời con cháu cùng đóng góp tư liệu gia phả, phân quyền minh bạch cho từng chi phái.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Decree 13 Compliance Highlight */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#122314] via-[#0d1a0e] to-[#081209] border border-emerald-900/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#68ef3f]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b3820] text-[#68ef3f] text-xs font-semibold border border-emerald-800">
              <ShieldCheck size={14} />
              <span>Nghị định 13/2023/NĐ-CP • GDPR • CCPA</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dữ Liệu Gia Tộc Thuộc Quyền Sở Hữu Của Gia Đình Bạn
            </h3>

            <p className="text-sm text-[#b7bda5] leading-relaxed">
              Chúng tôi cam kết chỉ thu thập dữ liệu thật sự cần thiết. Mọi thông tin được minh bạch mục đích, 
              chặn tuyệt đối các mã theo dõi thương mại và trao quyền tự xóa dữ liệu vĩnh viễn bất kỳ lúc nào.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={() => onOpenLegalDocs('PRIVACY')}
                className="text-xs font-semibold text-[#68ef3f] hover:text-[#58dc31] underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem Chính sách bảo mật</span>
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onOpenLegalDocs('COOKIE')}
                className="text-xs font-semibold text-[#68ef3f] hover:text-[#58dc31] underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Chính sách Cookie riêng biệt</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto p-6 sm:p-7 rounded-2xl bg-[#0a140b]/90 border border-emerald-900/60 space-y-3.5 shrink-0 shadow-lg relative z-10">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
              <span>Mã hóa bảo mật đường truyền SSL/TLS</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
              <span>Chặn tracking trước khi người dùng bấm đồng ý</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
              <span>Không bán, không chuyển nhượng dữ liệu</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
              <span>Lưu trữ phả hệ trọn đời và bảo mật</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing / Membership Plans */}
      <section id="pricing" className="py-20 sm:py-28 bg-[#0a140b] border-t border-[#273f2b] px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Bảng Giá Hội Viên Minh Bạch
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-[#b7bda5]">
              Khởi đầu miễn phí, nâng cấp khi cần mở rộng quy mô toàn dòng họ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="p-8 sm:p-9 rounded-3xl bg-[#122314] border border-[#273f2b] flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Gói Gia Đình (Cơ Bản)</h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] mt-1.5">Dành cho gia đình nhỏ khởi tạo gia phả 3 - 4 thế hệ.</p>
                <div className="mt-6 text-4xl font-extrabold text-white">
                  0 đ <span className="text-xs font-normal text-[#b7bda5]">/ Trọn đời</span>
                </div>

                <ul className="mt-7 space-y-3.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Lưu trữ tối đa 50 thành viên</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Tính ngày giỗ Âm - Dương & nhắc nhở</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Bàn tính vai vế xưng hô họ hàng</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Trắc nghiệm phả hệ kết nối con cháu</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenRegister}
                className="mt-8 w-full py-3.5 rounded-full text-sm font-semibold bg-[#1a331d] hover:bg-[#224426] text-white border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all cursor-pointer shadow-sm"
              >
                Dùng Miễn Phí
              </button>
            </div>

            {/* Pro / Patriarch Plan */}
            <div className="p-8 sm:p-9 rounded-3xl bg-gradient-to-b from-[#162f19] to-[#102213] border-2 border-[#68ef3f]/60 relative flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.6),_0_0_30px_rgba(104,239,63,0.15)]">
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-[#68ef3f] text-[#122314] text-[11px] font-extrabold tracking-wide uppercase shadow-md">
                Khuyên Dùng Cho Dòng Họ
              </div>

              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Gói Trưởng Tộc / Dòng Họ</span>
                  <Sparkles size={17} className="text-[#68ef3f]" />
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] mt-1.5">Quản lý toàn bộ các chi phái và không giới hạn thành viên.</p>
                <div className="mt-6 text-4xl font-extrabold text-[#68ef3f]">
                  Nâng Cấp <span className="text-xs font-normal text-[#b7bda5]">/ Hội viên</span>
                </div>

                <ul className="mt-7 space-y-3.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span className="font-semibold text-white">Không giới hạn số lượng thành viên</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Quản lý không giới hạn các nhánh chi phái</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Xuất ảnh sơ đồ độ phân giải siêu cao (In ấn)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Xuất toàn bộ gia phả ra file Excel</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-[#68ef3f] shrink-0" />
                    <span>Phân quyền chi tiết cho ban quản tộc</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenRegister}
                className="mt-8 w-full py-3.5 rounded-full text-sm font-bold bg-[#68ef3f] text-[#122314] hover:bg-[#58dc31] shadow-[0_0_25px_rgba(104,239,63,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Khởi Tạo Cây Dòng Họ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer With Legal Documents Links & Nature Footer Background */}
      <footer className="mt-auto relative border-t border-[#273f2b] py-16 px-4 sm:px-6 text-xs text-slate-300 overflow-hidden">
        {/* Footer Background Image (WebP + fallback) - Độ sáng và tương phản tự nhiên, sắc nét */}
        <div className="absolute inset-0 pointer-events-none -z-20">
          <picture className="w-full h-full block">
            <source srcSet={footerBgWebp} type="image/webp" />
            <img
              src="/images/footer-bg.webp"
              alt="Cội nguồn dòng tộc footer"
              className="w-full h-full object-cover object-center opacity-85 brightness-110 contrast-105"
            />
          </picture>
        </div>
        {/* Lớp phủ gradient tinh tế để cảnh thiên nhiên hiển thị rõ ràng mà chữ vẫn cực kỳ dễ đọc */}
        <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#040805]/95 via-[#070e09]/70 to-[#070e09]/80" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <FamilyTreeLogo size={38} />
            <div>
              <div className="font-bold text-white text-base tracking-wide flex items-center justify-center md:justify-start gap-2">
                <span>Famlykin</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#122314] text-[#68ef3f] border border-[#273f2b]">Gia Phả Số Hóa</span>
              </div>
              <p className="text-xs text-[#d0d7c0] mt-1 max-w-sm">
                Nền tảng số hóa gia phả & bảo tồn văn hóa dòng tộc Việt Nam
              </p>
              <div className="text-xs text-[#68ef3f] mt-1 font-mono font-medium">
                Email: lienhe@famlykin.io.vn
              </div>
            </div>
          </div>

          {/* Legal Documents Required Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onOpenLegalDocs('PRIVACY')}
              className="text-[#e2e8f0] hover:text-[#68ef3f] transition-colors cursor-pointer hover:underline underline-offset-4 py-1"
            >
              Chính Sách Bảo Mật (NĐ 13)
            </button>
            <span className="text-[#3b5e40]">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('TERMS')}
              className="text-[#e2e8f0] hover:text-[#68ef3f] transition-colors cursor-pointer hover:underline underline-offset-4 py-1"
            >
              Điều Khoản Dịch Vụ
            </button>
            <span className="text-[#3b5e40]">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('COOKIE')}
              className="text-[#e2e8f0] hover:text-[#68ef3f] transition-colors cursor-pointer hover:underline underline-offset-4 py-1"
            >
              Chính Sách Cookie
            </button>
          </div>

          {/* Copyright */}
          <div className="text-[11px] text-slate-300 text-center md:text-right">
            <div className="font-medium text-slate-200">© {new Date().getFullYear()} Famlykin. All rights reserved.</div>
            <div className="text-[#a3b19b] mt-0.5">Tuân thủ Nghị định 13/2023/NĐ-CP & GDPR.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
