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
  const [scrollY, setScrollY] = useState(0);

  // Lắng nghe sự kiện scroll để tạo hiệu ứng Parallax & Fade-out mượt mà
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Tính toán độ mờ nền Hero thiên nhiên theo vị trí cuộn trang (Fade-out sau nút CTA)
  // Khi cuộn từ 0px đến 450px: opacity giảm dần từ 1 xuống 0.05
  const heroBgOpacity = Math.max(0.08, 1 - scrollY / 420);
  const heroParallaxOffset = scrollY * 0.25; // Parallax dịch chuyển nhẹ

  return (
    <div className="min-h-screen bg-[#070e09] text-slate-100 flex flex-col font-sans selection:bg-[#68ef3f] selection:text-slate-950 overflow-x-hidden">
      {/* 1. Navbar Cao Cấp Phong Cách SaaS Hiện Đại (Tomorro Inspired) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 20
            ? 'backdrop-blur-md bg-[#0b160f]/85 border-b border-[#273f2b]/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            : 'backdrop-blur-sm bg-[#0b160f]/60 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo Famlykin */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
          </div>

          {/* Desktop Navigation Links (Trung tâm) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-3 py-1.5 rounded-full bg-[#122314]/70 border border-[#273f2b] backdrop-blur-md">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer"
            >
              Tính Năng
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer"
            >
              Bảng Giá
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-[#b7bda5] hover:text-white hover:bg-[#1a331d]/60 transition-all cursor-pointer"
            >
              Liên Hệ
            </button>
          </nav>

          {/* Desktop Right CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white hover:text-[#68ef3f] bg-transparent hover:bg-[#122314] border border-[#273f2b] transition-all cursor-pointer whitespace-nowrap"
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_20px_rgba(104,239,63,0.3)] transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Khởi Tạo Cây</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile Hamburger Button (< 768px) - 2 gạch ngang chuyển thành dấu X */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1.5 bg-[#122314] border border-[#273f2b] text-white hover:text-[#68ef3f] transition-all focus:outline-none relative"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              <span
                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${
                  mobileMenuOpen ? 'rotate-45 translate-y-[4px]' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen / Drawer Slide-down Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 sm:top-20 z-50 bg-[#070e09] backdrop-blur-2xl border-b border-[#273f2b] shadow-2xl animate-drawer-slide-down px-6 py-6 flex flex-col justify-between overflow-y-auto">
            <nav className="flex flex-col space-y-3.5 my-2">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="w-full text-left py-3.5 px-4 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between"
              >
                <span>🌿 Tính Năng Cốt Lõi</span>
                <ChevronRight size={18} className="text-[#68ef3f]" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('pricing')}
                className="w-full text-left py-3.5 px-4 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between"
              >
                <span>💎 Bảng Giá Hội Viên</span>
                <ChevronRight size={18} className="text-[#68ef3f]" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="w-full text-left py-3.5 px-4 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between"
              >
                <span>✉️ Liên Hệ & Hỗ Trợ</span>
                <ChevronRight size={18} className="text-[#68ef3f]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLegalDocs('PRIVACY');
                }}
                className="w-full text-left py-3.5 px-4 rounded-2xl text-base font-semibold text-slate-100 hover:text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/50 transition-all flex items-center justify-between"
              >
                <span>🛡️ Chính Sách Bảo Mật (NĐ 13)</span>
                <ChevronRight size={18} className="text-[#68ef3f]" />
              </button>
            </nav>

            <div className="pt-4 pb-8 border-t border-[#273f2b] flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all text-center"
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="w-full py-3.5 rounded-full text-sm font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_25px_rgba(104,239,63,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span>Khởi Tạo Cây Ngay</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section Với Nền Thiên Nhiên, Gradient Tinh Tế & Scroll Fade-Out */}
      <section className="relative pt-24 sm:pt-36 pb-20 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-visible">
        {/* Lớp Ảnh Thiên Nhiên Phong Cảnh Đồi Chè hero-bg.png (Kéo dài từ đỉnh Hero Section xuống hết cụm nút CTA chính) */}
        <div
          className="absolute inset-x-0 -top-24 sm:-top-32 h-[680px] sm:h-[780px] pointer-events-none -z-20 overflow-hidden"
          style={{
            opacity: Math.max(0, 1 - scrollY / 320),
            transition: 'opacity 0.25s ease-out',
          }}
        >
          <img
            src="/images/hero-bg.png"
            alt="Phong cảnh thiên nhiên cội nguồn"
            className="w-full h-full object-cover object-center brightness-110 contrast-105"
            style={{
              transform: `translateY(${heroParallaxOffset}px) scale(1.02)`,
            }}
          />
        </div>

        {/* Lớp Phủ Gradient Chuẩn: bg-gradient-to-b from-black/60 via-black/30 to-[#070e09]/95 để chữ trắng hiển thị nổi bật sắc nét */}
        <div
          className="absolute inset-x-0 -top-24 sm:-top-32 h-[680px] sm:h-[780px] pointer-events-none -z-10 bg-gradient-to-b from-black/60 via-black/30 to-[#070e09]"
          style={{
            opacity: Math.max(0, 1 - scrollY / 320),
            transition: 'opacity 0.25s ease-out',
          }}
        />

        {/* Neon Botanical Glow Atmosphere Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[680px] h-[350px] sm:h-[680px] bg-[#68ef3f]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#122314]/90 border border-[#273f2b] text-[#68ef3f] text-xs sm:text-sm font-semibold mb-6 shadow-lg backdrop-blur-md">
          <Sparkles size={15} className="text-[#68ef3f]" />
          <span>Lưu truyền gốc rễ • Kết nối trăm năm</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight sm:leading-tight drop-shadow-md">
          Số Hóa Cây Gia Phả & Quản Lý <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d9deca] to-[#68ef3f] drop-shadow-[0_0_40px_rgba(104,239,63,0.35)]">
            Ngày Giỗ Tổ Tiên Cổ Truyền
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-lg text-[#d0d7c0] max-w-2xl leading-relaxed font-normal drop-shadow-sm">
          Nền tảng phả hệ Việt Nam đầu tiên tích hợp <strong className="text-white">Lịch Giỗ Âm - Dương thông minh</strong>, 
          bàn tính xưng hô chuẩn thuần phong mỹ tục, và trắc nghiệm dòng tộc dành cho thế hệ tương lai.
        </p>

        {/* CTA Buttons (Responsive Full-width trên mobile, hàng ngang trên desktop) */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto z-10">
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-full text-base sm:text-lg font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_35px_rgba(104,239,63,0.45)] transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <span>Bắt Đầu Miễn Phí Ngay</span>
            <ChevronRight size={20} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onStartDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm sm:text-base font-semibold text-[#f2f5eb] bg-[#122314]/90 hover:bg-[#1a331d] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-md backdrop-blur-md"
          >
            <TreePine size={18} className="text-[#68ef3f]" />
            <span>Khám Phá Cây Mẫu Trải Nghiệm</span>
          </button>
        </div>

        {/* Hero Interactive App Mockup Preview - 3D Perspective Tilt Tomorro Style */}
        <div className="mt-20 sm:mt-28 w-full max-w-5xl [perspective:1400px]">
          <div className="rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-[#1a331d]/60 via-[#122314]/50 to-[#0a140b] border border-[#273f2b]/80 shadow-[0_30px_80px_rgba(0,0,0,0.85),_0_0_50px_rgba(104,239,63,0.15)] transform transition-transform duration-500 hover:[transform:none] sm:[transform:rotateX(6deg)_rotateY(-3deg)_rotateZ(-1deg)]">
            <div className="rounded-2xl overflow-hidden bg-[#0a140b] border border-[#273f2b] relative">
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
              <div className="p-6 sm:p-14 relative flex flex-col items-center justify-center min-h-[340px] sm:min-h-[440px] bg-gradient-to-b from-[#0e1c10] to-[#081209]">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(104, 239, 63, 0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {/* Level 1: Ancestor */}
                <div className="flex flex-col items-center z-10 w-full max-w-2xl">
                  <div className="px-6 py-3.5 rounded-2xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_25px_rgba(104,239,63,0.25)] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#68ef3f]/20 text-[#68ef3f] font-bold flex items-center justify-center text-sm border border-[#68ef3f]/40">
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

                  {/* CÂY GIA PHẢ - MOBILE VIEW: Kẻ 1 đường trục dọc xuyên suốt và rẽ nhánh nối cả 3 người con */}
                  <div className="sm:hidden flex flex-col items-center w-full mt-1">
                    {/* Trục dọc nối từ Cụ xuống */}
                    <div className="w-0.5 h-6 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.6)]" />

                    <div className="relative flex flex-col gap-3 w-full max-w-[280px] pl-6">
                      {/* Trục xương sống dọc bên trái */}
                      <div className="absolute left-2.5 top-0 bottom-6 w-0.5 bg-[#68ef3f] shadow-[0_0_8px_rgba(104,239,63,0.6)]" />

                      {/* Con 1 */}
                      <div className="relative">
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-[#68ef3f]" />
                        <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                            NA
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">Nguyễn Văn Anh</div>
                            <div className="text-[11px] text-[#68ef3f] font-semibold">Bác ruột (Đời 2)</div>
                          </div>
                        </div>
                      </div>

                      {/* Con 2 */}
                      <div className="relative">
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-[#68ef3f]" />
                        <div className="px-4 py-2.5 rounded-xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_15px_rgba(104,239,63,0.2)] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#68ef3f]/25 text-[#68ef3f] font-semibold flex items-center justify-center text-xs border border-[#68ef3f]/40">
                            NB
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-white">Nguyễn Văn Ba</div>
                            <div className="text-[11px] text-[#68ef3f] font-semibold">Bố ruột (Đời 2)</div>
                          </div>
                        </div>
                      </div>

                      {/* Con 3 */}
                      <div className="relative">
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-[#68ef3f]" />
                        <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
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

          {/* 3 Cột Desktop / 1 Cột Mobile với backdrop-blur-md bg-[#122314]/65 border border-emerald-950 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {/* Feature 1: Sơ Đồ Phả Hệ */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-[#68ef3f] group-hover:scale-105 transition-transform shadow-inner">
                  <TreePine size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Sơ Đồ Phả Hệ Động Đa Thế Hệ
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tự động sắp xếp nhánh Nội - Ngoại mượt mà, chuyển đổi góc nhìn theo từng thành viên chỉ với một chạm.
                </p>
              </div>
            </div>

            {/* Feature 2: Lịch Giỗ Âm Dương */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-rose-400 group-hover:scale-105 transition-transform shadow-inner">
                  <Flame size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Lịch Giỗ Âm - Dương Tự Động
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tự động quy đổi ngày giỗ Âm lịch tổ tiên sang Dương lịch từng năm, đếm ngược và nhắc nhở con cháu.
                </p>
              </div>
            </div>

            {/* Feature 3: Bàn Tính Xưng Hô */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-amber-400 group-hover:scale-105 transition-transform shadow-inner">
                  <Calculator size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Bàn Tính Vai Vế Xưng Hô
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Chọn 2 người bất kỳ trong gia tộc để tra cứu xưng hô chuẩn thuần phong mỹ tục kèm diễn giải rõ ràng.
                </p>
              </div>
            </div>

            {/* Feature 4: Trắc Nghiệm Phả Hệ */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-indigo-400 group-hover:scale-105 transition-transform shadow-inner">
                  <Award size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Trắc Nghiệm Phả Hệ (Flashcard)
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Đố vui tương tác giúp thế hệ trẻ dễ dàng ghi nhớ mặt người thân và cội nguồn tổ tiên ngày sum vầy.
                </p>
              </div>
            </div>

            {/* Feature 5: Xuất File Excel / Ảnh */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-teal-300 group-hover:scale-105 transition-transform shadow-inner">
                  <Download size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Xuất File Excel & Ảnh Siêu Nét
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tải ảnh sơ đồ độ phân giải cực cao để in ấn tranh thờ họ, hoặc sao lưu toàn bộ cây ra bảng tính Excel.
                </p>
              </div>
            </div>

            {/* Feature 6: Cộng Tác Thời Gian Thực */}
            <div className="p-7 sm:p-8 rounded-3xl backdrop-blur-md bg-[#122314]/65 border border-emerald-950 hover:border-[#68ef3f]/40 hover:bg-[#162d19]/80 transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1a3820] border border-emerald-900/60 flex items-center justify-center mb-5 text-[#68ef3f] group-hover:scale-105 transition-transform shadow-inner">
                  <Users size={24} className="stroke-[2.2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5">
                  Cộng Tác Dòng Họ Thời Gian Thực
                </h3>
                <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed">
                  Tạo link mời con cháu cùng cập nhật thông tin, phân quyền minh bạch giữa Trưởng tộc và người đóng góp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Decree 13 Compliance Highlight */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck size={14} />
              <span>Nghị định 13/2023/NĐ-CP • GDPR • CCPA</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              Dữ Liệu Gia Tộc Thuộc Quyền Sở Hữu Của Gia Đình Bạn
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              Chúng tôi cam kết chỉ thu thập dữ liệu thật sự cần thiết. Mọi thông tin được khai báo mục đích minh bạch, 
              chặn tuyệt đối các mã theo dõi thương mại trước khi có sự đồng ý, và trao quyền tự xóa dữ liệu vĩnh viễn bất kỳ lúc nào.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={() => onOpenLegalDocs('PRIVACY')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem Chính sách bảo mật</span>
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onOpenLegalDocs('COOKIE')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Chính sách Cookie riêng biệt</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Mã hóa bảo mật đường truyền SSL/TLS</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Chặn tracking trước khi người dùng bấm đồng ý</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Không bán, không chuyển nhượng dữ liệu</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
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

      {/* 6. Contact Section */}
      <section id="contact" className="py-16 sm:py-24 bg-[#070e09] border-t border-[#273f2b] px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#122314] border border-[#273f2b] text-[#68ef3f] text-xs font-semibold">
            <span>Hỗ Trợ Kỹ Thuật & Cố Vấn Dòng Tộc</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Bạn Cần Tư Vấn Thiết Lập Gia Phả Cho Chi Tộc?
          </h3>
          <p className="text-sm sm:text-base text-[#b7bda5] max-w-xl mx-auto leading-relaxed">
            Đội ngũ Famlykin luôn sẵn sàng hỗ trợ các bậc cao niên và ban quản tộc số hóa dữ liệu tổ tiên chính xác, bảo mật và chuẩn phong tục Việt.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="mailto:lienhe@famlykin.io.vn"
              className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-[#122314] text-white hover:text-[#68ef3f] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all flex items-center gap-2"
            >
              <span>Gửi Email: lienhe@famlykin.io.vn</span>
            </a>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-[#68ef3f] text-[#122314] hover:bg-[#58dc31] shadow-[0_0_20px_rgba(104,239,63,0.3)] transition-all cursor-pointer"
            >
              Tạo Cây Ngay Bây Giờ
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer With Legal Documents Links & Nature Footer Background */}
      <footer className="mt-auto relative border-t border-[#273f2b] py-14 px-4 sm:px-6 text-xs text-slate-400 overflow-hidden">
        {/* Footer Background Image footer-bg.png */}
        <div className="absolute inset-0 pointer-events-none -z-20">
          <img
            src="/images/footer-bg.png"
            alt="Cội nguồn dòng tộc footer"
            className="w-full h-full object-cover object-bottom opacity-40 brightness-75 contrast-110"
          />
        </div>
        {/* Lớp phủ gradient tối bảo đảm độ tương phản chữ */}
        <div className="absolute inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#050b06] via-[#070e09]/90 to-[#070e09]/98" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <FamilyTreeLogo size={28} />
            <div>
              <div className="font-bold text-white text-sm">Famlykin</div>
              <p className="text-[11px] text-slate-400">
                Nền tảng số hóa gia phả & bảo tồn văn hóa dòng tộc Việt Nam • Email: lienhe@famlykin.io.vn
              </p>
            </div>
          </div>

          {/* Legal Documents Required Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
            <button
              type="button"
              onClick={() => onOpenLegalDocs('PRIVACY')}
              className="hover:text-[#68ef3f] transition-colors cursor-pointer text-slate-300"
            >
              Chính Sách Bảo Mật (NĐ 13)
            </button>
            <span className="text-[#273f2b]">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('TERMS')}
              className="hover:text-[#68ef3f] transition-colors cursor-pointer text-slate-300"
            >
              Điều Khoản Dịch Vụ
            </button>
            <span className="text-[#273f2b]">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('COOKIE')}
              className="hover:text-[#68ef3f] transition-colors cursor-pointer text-slate-300"
            >
              Chính Sách Cookie
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            © {new Date().getFullYear()} Famlykin. Tuân thủ Nghị định 13/2023/NĐ-CP & GDPR.
          </div>
        </div>
      </footer>
    </div>
  );
};
