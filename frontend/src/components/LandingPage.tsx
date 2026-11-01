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
              className="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <span>Khởi Tạo Cây</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6">
          <Sparkles size={15} />
          <span>Lưu truyền gốc rễ • Kết nối trăm năm</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight sm:leading-tight">
          Số Hóa Cây Gia Phả & Quản Lý <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
            Ngày Giỗ Tổ Tiên Cổ Truyền
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
          Nền tảng phả hệ Việt Nam đầu tiên tích hợp <strong>Lịch Giỗ Âm - Dương thông minh</strong>, 
          bàn tính xưng hô chuẩn thuần phong mỹ tục, và trắc nghiệm dòng tộc dành cho thế hệ tương lai.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Bắt Đầu Miễn Phí Ngay</span>
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={onStartDemo}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm sm:text-base font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <TreePine size={18} className="text-emerald-400" />
            <span>Khám Phá Cây Mẫu Trải Nghiệm</span>
          </button>
        </div>

        {/* Hero Interactive App Mockup Preview (Minh họa trực quan giao diện) */}
        <div className="mt-12 sm:mt-16 w-full max-w-5xl rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-emerald-500/20 via-slate-900/50 to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
          <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
            {/* Mockup browser bar */}
            <div className="h-10 bg-slate-900/90 px-4 flex items-center gap-2 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="mx-auto px-4 py-1 rounded-md bg-slate-950 text-[11px] text-slate-400 border border-slate-800/80 font-mono">
                https://famlykin.io.vn
              </div>
            </div>

            {/* Tree Canvas Preview Card Graphic */}
            <div className="p-6 sm:p-12 relative flex flex-col items-center justify-center min-h-[280px] sm:min-h-[380px] bg-gradient-to-b from-[#061e12] to-[#04120b]">
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              {/* Level 1: Ancestor */}
              <div className="flex flex-col items-center z-10">
                <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-500/40">
                    NV
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Nguyễn Văn Cụ</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Đời 1</span>
                    </div>
                    <div className="text-xs text-rose-300 flex items-center gap-1 mt-0.5 font-medium">
                      <Flame size={12} className="text-rose-400" />
                      <span>Giỗ Âm: 15/07 Âm lịch</span>
                    </div>
                  </div>
                </div>

                {/* Connecting branch line */}
                <div className="w-0.5 h-10 bg-emerald-400/60 my-1" />

                {/* Level 2: Children */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-semibold flex items-center justify-center text-xs">
                      NA
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Nguyễn Văn Anh</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">Bác ruột (Đời 2)</div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border-2 border-emerald-500 shadow-md flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-center text-xs border border-emerald-500/40">
                      NB
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Nguyễn Văn Ba</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">Bố ruột (Đời 2)</div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-semibold flex items-center justify-center text-xs">
                      NC
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Nguyễn Thị Cúc</div>
                      <div className="text-[11px] text-teal-400 font-semibold">Cô ruột (Đời 2)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight trust badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span>Bảo mật chuẩn Nghị định 13</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-emerald-400" />
            <span>Thuộc quyền sở hữu 100% của gia đình</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale size={17} className="text-emerald-400" />
            <span>Không thương mại hóa dữ liệu</span>
          </div>
        </div>
      </section>

      {/* 3. Core Features Showcase */}
      <section className="py-16 sm:py-24 bg-slate-900/50 border-y border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white tracking-wide">
              Được Thiết Kế Tỉ Mỉ Cho Phong Tục Việt
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              Giải quyết trọn vẹn những khó khăn trong việc ghi chép, nhớ lịch giỗ và xưng hô vai vế dòng họ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TreePine size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sơ Đồ Phả Hệ Động Đa Thế Hệ</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tự động bố trí cây theo nhánh Nội - Ngoại, chuyển đổi góc nhìn theo từng thành viên, hỗ trợ kéo thả mượt mà trên cả điện thoại và máy tính.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Flame size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lịch Giỗ Âm - Dương Tự Động</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tự động quy đổi ngày giỗ Âm lịch tổ tiên sang ngày Dương lịch của năm nay. Đếm ngược thông minh và gửi thông báo nhắc lịch cho con cháu.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calculator size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bàn Tính Vai Vế Xưng Hô</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Chọn bất kỳ hai người trong dòng họ để tra cứu cách xưng hô chính xác: Bác ruột, Chú, Cậu, Thím, Thím họ... kèm diễn giải phả hệ rõ ràng.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Trắc Nghiệm Phả Hệ (Flashcard)</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Giúp con cháu thế hệ trẻ học hỏi và ghi nhớ mặt người thân, nguồn cội tổ tiên qua trò chơi đố vui tương tác thú vị trong dịp Tết, giỗ chạp.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Xuất File Excel & Ảnh Siêu Nét</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tải ảnh cây độ phân giải cao để in ấn tranh gia phả treo nhà thờ họ, hoặc xuất toàn bộ dữ liệu ra bảng tính Excel để lưu trữ ngoại tuyến.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cộng Tác Dòng Họ Thời Gian Thực</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
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
