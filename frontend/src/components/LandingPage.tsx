import React from 'react';
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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <FamilyTreeLogo size={36} />
            <div>
              <span className="text-xl sm:text-2xl font-bold font-serif tracking-wider text-emerald-400">
                Famlykin
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Gia Phả Số Hóa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#122314] hover:bg-[#1a331d] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              Đăng Nhập
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-10 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Effects: Neo-botanical Electric Sprout orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[350px] sm:h-[650px] bg-[#68ef3f]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#26a200]/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#122314] border border-[#273f2b] text-[#68ef3f] text-xs sm:text-sm font-semibold mb-6 shadow-inner">
          <Sparkles size={15} className="text-[#68ef3f]" />
          <span>Lưu truyền gốc rễ • Kết nối trăm năm</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight sm:leading-tight">
          Số Hóa Cây Gia Phả & Quản Lý <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d9deca] to-[#68ef3f] drop-shadow-[0_0_35px_rgba(104,239,63,0.35)]">
            Ngày Giỗ Tổ Tiên Cổ Truyền
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-[#b7bda5] max-w-2xl leading-relaxed font-normal">
          Nền tảng phả hệ Việt Nam đầu tiên tích hợp <strong className="text-white">Lịch Giỗ Âm - Dương thông minh</strong>, 
          bàn tính xưng hô chuẩn thuần phong mỹ tục, và trắc nghiệm dòng tộc dành cho thế hệ tương lai.
        </p>

        {/* CTA Buttons - Tomorro Neo-botanical Pill Style */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-full text-base sm:text-lg font-bold text-[#122314] bg-[#68ef3f] hover:bg-[#58dc31] shadow-[0_0_30px_rgba(104,239,63,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <span>Bắt Đầu Miễn Phí Ngay</span>
            <ChevronRight size={20} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onStartDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-sm sm:text-base font-semibold text-[#f2f5eb] bg-[#122314]/90 hover:bg-[#1a331d] border border-[#273f2b] hover:border-[#68ef3f]/60 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
          >
            <TreePine size={18} className="text-[#68ef3f]" />
            <span>Khám Phá Cây Mẫu Trải Nghiệm</span>
          </button>
        </div>

        {/* Hero Interactive App Mockup Preview - 3D Perspective Tilt Tomorro Style */}
        <div className="mt-14 sm:mt-20 w-full max-w-5xl [perspective:1400px]">
          <div className="rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-[#1a331d]/60 via-[#122314]/40 to-[#0a140b] border border-[#273f2b]/80 shadow-[0_30px_80px_rgba(0,0,0,0.85),_0_0_50px_rgba(104,239,63,0.15)] transform transition-transform duration-500 hover:[transform:none] sm:[transform:rotateX(6deg)_rotateY(-3deg)_rotateZ(-1deg)]">
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
              <div className="p-6 sm:p-14 relative flex flex-col items-center justify-center min-h-[300px] sm:min-h-[420px] bg-gradient-to-b from-[#0e1c10] to-[#081209]">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(104, 239, 63, 0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {/* Level 1: Ancestor */}
                <div className="flex flex-col items-center z-10">
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
                        <span>Giỗ Âm: 15/07 Âm lịch (Đỏ cảnh báo)</span>
                      </div>
                    </div>
                  </div>

                  {/* Connecting branch line */}
                  <div className="w-0.5 h-10 bg-[#68ef3f]/60 my-1 shadow-[0_0_8px_rgba(104,239,63,0.5)]" />

                  {/* Level 2: Children */}
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                    <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-[#1b341f] text-[#d9deca] font-semibold flex items-center justify-center text-xs border border-[#273f2b]">
                        NA
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Nguyễn Văn Anh</div>
                        <div className="text-[11px] text-[#68ef3f] font-semibold">Bác ruột (Đời 2)</div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-[#122314] border-2 border-[#68ef3f]/70 shadow-[0_0_20px_rgba(104,239,63,0.2)] flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#68ef3f]/25 text-[#68ef3f] font-semibold flex items-center justify-center text-xs border border-[#68ef3f]/40">
                        NB
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Nguyễn Văn Ba</div>
                        <div className="text-[11px] text-[#68ef3f] font-semibold">Bố ruột (Đời 2)</div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 rounded-xl bg-[#122314] border border-[#273f2b] flex items-center gap-2.5 shadow-sm">
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
              </div>
            </div>
          </div>
        </div>

        {/* Highlight trust badges */}
        <div className="mt-14 pt-8 border-t border-[#273f2b] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-[#b7bda5]">
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

      {/* 3. Core Features Showcase - Tomorro Card Grid System */}
      <section className="py-20 sm:py-28 bg-[#0a140b] border-y border-[#273f2b] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#122314] border border-[#273f2b] text-[#68ef3f] text-xs font-semibold mb-4">
              <span>Đặc Quyền Bản Sắc Dòng Họ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Được Thiết Kế Tỉ Mỉ Cho Phong Tục Việt
            </h2>
            <p className="mt-3.5 text-sm sm:text-base text-[#b7bda5] leading-relaxed">
              Giải quyết trọn vẹn những khó khăn trong việc ghi chép, nhớ lịch giỗ và xưng hô vai vế dòng họ qua giao diện trực quan và bảo mật.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#68ef3f] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#68ef3f]/20 transition-all shadow-inner">
                <TreePine size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Sơ Đồ Phả Hệ Động Đa Thế Hệ</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Tự động bố trí cây theo nhánh Nội - Ngoại, chuyển đổi góc nhìn theo từng thành viên, hỗ trợ kéo thả mượt mà trên cả điện thoại và máy tính.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#f87171] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all shadow-inner">
                <Flame size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Lịch Giỗ Âm - Dương Tự Động</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Tự động quy đổi ngày giỗ Âm lịch tổ tiên sang ngày Dương lịch của năm nay. Đếm ngược thông minh và gửi thông báo nhắc lịch cho con cháu.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#fbbf24] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all shadow-inner">
                <Calculator size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Bàn Tính Vai Vế Xưng Hô</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Chọn bất kỳ hai người trong dòng họ để tra cứu cách xưng hô chính xác: Bác ruột, Chú, Cậu, Thím, Thím họ... kèm diễn giải phả hệ rõ ràng.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#818cf8] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all shadow-inner">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Trắc Nghiệm Phả Hệ (Flashcard)</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Giúp con cháu thế hệ trẻ học hỏi và ghi nhớ mặt người thân, nguồn cội tổ tiên qua trò chơi đố vui tương tác thú vị trong dịp Tết, giỗ chạp.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#2dd4bf] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all shadow-inner">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Xuất File Excel & Ảnh Siêu Nét</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Tải ảnh cây độ phân giải cao để in ấn tranh gia phả treo nhà thờ họ, hoặc xuất toàn bộ dữ liệu ra bảng tính Excel để lưu trữ ngoại tuyến.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-3xl bg-[#122314] border border-[#273f2b] hover:border-[#68ef3f]/60 hover:shadow-[0_8px_30px_rgba(104,239,63,0.12)] transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1f3a23] text-[#68ef3f] border border-[#273f2b] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#68ef3f]/20 transition-all shadow-inner">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2.5 flex items-center gap-2">
                <span>Cộng Tác Dòng Họ Thời Gian Thực</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#b7bda5] leading-relaxed font-normal">
                Tạo liên kết chia sẻ mời con cháu cùng bổ sung thông tin. Phân quyền chặt chẽ giữa Trưởng tộc, Người đóng góp và Khách chỉ xem.
              </p>
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
              <span>Cam kết hoàn tiền trong 7 ngày</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing / Membership Plans */}
      <section className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white">
              Bảng Giá Hội Viên Minh Bạch
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400">
              Khởi đầu miễn phí, nâng cấp khi cần mở rộng quy mô toàn dòng họ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Gói Gia Đình (Cơ Bản)</h3>
                <p className="text-xs text-slate-400 mt-1">Dành cho gia đình nhỏ khởi tạo gia phả 3 - 4 thế hệ.</p>
                <div className="mt-5 text-3xl font-extrabold text-white">
                  0 đ <span className="text-xs font-normal text-slate-400">/ Trọn đời</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Lưu trữ tối đa 50 thành viên</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Tính ngày giỗ Âm - Dương & nhắc nhở</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Bàn tính vai vế xưng hô họ hàng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Trắc nghiệm phả hệ kết nối con cháu</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenRegister}
                className="mt-8 w-full py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
              >
                Dùng Miễn Phí
              </button>
            </div>

            {/* Pro / Patriarch Plan */}
            <div className="p-7 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 relative flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-extrabold tracking-wide uppercase">
                Khuyên Dùng Cho Dòng Họ
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Gói Trưởng Tộc / Dòng Họ</span>
                  <Sparkles size={16} className="text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">Quản lý toàn bộ các chi phái và không giới hạn thành viên.</p>
                <div className="mt-5 text-3xl font-extrabold text-emerald-400">
                  Nâng Cấp <span className="text-xs font-normal text-slate-400">/ Hội viên</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Không giới hạn số lượng thành viên</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Quản lý không giới hạn các nhánh chi phái</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Xuất ảnh sơ đồ độ phân giải siêu cao (In ấn)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Xuất toàn bộ gia phả ra file Excel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Cam kết hoàn tiền trong 7 ngày nếu có lỗi</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onOpenRegister}
                className="mt-8 w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Khởi Tạo Cây Dòng Họ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer With 4 Legal Documents Links */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FamilyTreeLogo size={28} />
            <div>
              <div className="font-bold text-white text-sm">Famlykin</div>
              <p className="text-[11px] text-slate-500">
                Nền tảng số hóa gia phả & bảo tồn văn hóa dòng tộc Việt Nam
              </p>
            </div>
          </div>

          {/* 4 Legal Documents Required Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
            <button
              type="button"
              onClick={() => onOpenLegalDocs('PRIVACY')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Chính Sách Bảo Mật (NĐ 13)
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('TERMS')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Điều Khoản Dịch Vụ
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('COOKIE')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Chính Sách Cookie
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => onOpenLegalDocs('REFUND')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Chính Sách Hoàn Tiền
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
