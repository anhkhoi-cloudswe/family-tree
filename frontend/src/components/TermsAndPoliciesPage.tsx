import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Cookie,
  RefreshCw,
  Scale,
  CheckCircle2,
  ArrowLeft,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

export type PolicyTab = 'PRIVACY' | 'TERMS' | 'COOKIE' | 'REFUND';

interface TermsAndPoliciesPageProps {
  initialTab?: PolicyTab;
  onBackToApp?: () => void;
}

export const TermsAndPoliciesPage: React.FC<TermsAndPoliciesPageProps> = ({
  initialTab = 'PRIVACY',
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('terms') && !p.includes('privacy') && !p.includes('&')) return 'TERMS';
      if (p.includes('cookie')) return 'COOKIE';
      if (p.includes('refund')) return 'REFUND';
      if (p.includes('privacy')) return 'PRIVACY';
    }
    return initialTab;
  });

  // Cập nhật tab nếu initialTab thay đổi
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: PolicyTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (onBackToApp) {
      onBackToApp();
    } else {
      window.location.href = '/guest';
    }
  };

  return (
    <div className="landing-enter-anim min-h-screen bg-[#070e09] text-slate-100 flex flex-col font-sans selection:bg-[#68ef3f] selection:text-slate-950 overflow-x-hidden">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#273f2b] bg-[#070e09]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleBack}>
            <div className="transition-transform duration-300 group-hover:scale-105">
              <FamilyTreeLogo size={36} />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold font-serif tracking-wider text-white group-hover:text-[#68ef3f] transition-colors">
                Famlykin
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] px-2.5 py-0.5 rounded-full bg-[#122314] text-[#68ef3f] border border-[#273f2b] font-medium">
                Điều Khoản & Chính Sách
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-[#122314] hover:bg-[#1a331d] border border-[#273f2b] hover:border-[#68ef3f]/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft size={15} className="text-[#68ef3f]" />
            <span>← Quay lại</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Banner */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#122314] border border-[#273f2b] text-[#68ef3f] text-xs font-semibold mb-3">
          <Scale size={14} />
          <span>Văn bản pháp lý chính thức • Hiệu lực từ 11/2026</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white tracking-wide">
          Chính Sách & Điều Khoản Sử Dụng Famlykin
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Bảo vệ quyền riêng tư & dữ liệu gia phả dòng họ theo Nghị định 13/2023/NĐ-CP (Việt Nam), GDPR (Châu Âu) & CCPA (Hoa Kỳ).
        </p>
      </section>

      {/* 3. Main Content with Sidebar Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sticky Tab Menu */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-1.5 p-2 rounded-2xl bg-[#0b160f] border border-[#273f2b]">
            <button
              type="button"
              onClick={() => handleTabChange('PRIVACY')}
              className={`w-full py-3 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'PRIVACY'
                  ? 'bg-[#122314] text-[#68ef3f] border border-[#68ef3f]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#122314]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={17} className={activeTab === 'PRIVACY' ? 'text-[#68ef3f]' : 'text-slate-400'} />
                <span>1. Chính Sách Bảo Mật</span>
              </div>
              <ChevronRight size={15} className={activeTab === 'PRIVACY' ? 'opacity-100 text-[#68ef3f]' : 'opacity-0'} />
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('TERMS')}
              className={`w-full py-3 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'TERMS'
                  ? 'bg-[#122314] text-[#68ef3f] border border-[#68ef3f]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#122314]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={17} className={activeTab === 'TERMS' ? 'text-[#68ef3f]' : 'text-slate-400'} />
                <span>2. Điều Khoản Sử Dụng</span>
              </div>
              <ChevronRight size={15} className={activeTab === 'TERMS' ? 'opacity-100 text-[#68ef3f]' : 'opacity-0'} />
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('COOKIE')}
              className={`w-full py-3 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'COOKIE'
                  ? 'bg-[#122314] text-[#68ef3f] border border-[#68ef3f]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#122314]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cookie size={17} className={activeTab === 'COOKIE' ? 'text-[#68ef3f]' : 'text-slate-400'} />
                <span>3. Chính Sách Cookie</span>
              </div>
              <ChevronRight size={15} className={activeTab === 'COOKIE' ? 'opacity-100 text-[#68ef3f]' : 'opacity-0'} />
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('REFUND')}
              className={`w-full py-3 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'REFUND'
                  ? 'bg-[#122314] text-[#68ef3f] border border-[#68ef3f]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#122314]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw size={17} className={activeTab === 'REFUND' ? 'text-[#68ef3f]' : 'text-slate-400'} />
                <span>4. Chính Sách Hoàn Tiền</span>
              </div>
              <ChevronRight size={15} className={activeTab === 'REFUND' ? 'opacity-100 text-[#68ef3f]' : 'opacity-0'} />
            </button>
          </aside>

          {/* Right: Policy Document Content */}
          <article className="lg:col-span-3 p-6 sm:p-10 rounded-3xl bg-[#0b160f] border border-[#273f2b] text-slate-300 space-y-6 leading-relaxed text-sm sm:text-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {/* 1. PRIVACY TAB */}
            {activeTab === 'PRIVACY' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#122314] border border-[#273f2b] text-[#68ef3f]">
                  <h2 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#68ef3f]" />
                    <span>Tuân Thủ Nghị Định 13/2023/NĐ-CP & Tiêu Chuẩn Quốc Tế</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Famlykin cam kết bảo vệ dữ liệu gia phả dòng họ thiêng liêng. Dữ liệu của bạn được mã hóa và không bao giờ bị thương mại hóa hay bán cho bất kỳ bên thứ ba nào.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#68ef3f]" />
                    1. Nguyên Tắc Tối Giản Dữ Liệu (Data Minimization)
                  </h3>
                  <p>
                    Chúng tôi chỉ thu thập các dữ liệu cá nhân thật sự cần thiết để khởi tạo tài khoản và vẽ sơ đồ cây phả hệ:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li><strong className="text-white">Thông tin tài khoản:</strong> Họ tên, Địa chỉ Email (dùng xác thực bảo mật không cần mật khẩu Magic Link hoặc đăng nhập an toàn).</li>
                    <li><strong className="text-white">Thông tin phả hệ:</strong> Họ tên thành viên, Giới tính, Thế hệ (Đời), Ngày sinh, Ngày mất/Ngày giỗ âm lịch, Nơi an táng và mối liên kết gia đình.</li>
                    <li><strong className="text-white">Thông tin liên hệ bổ sung (Tùy chọn):</strong> Số điện thoại người dùng tự nguyện cung cấp để nhận diện dòng họ khi mời người thân vào cây.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#68ef3f]" />
                    2. Mục Đích Thu Thập Dữ Liệu Minh Bạch
                  </h3>
                  <p>
                    Mọi form nhập liệu trên hệ thống đều khai báo mục đích trước khi lưu trữ:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li>Xây dựng và số hóa cây gia phả tương tác cho gia tộc của bạn.</li>
                    <li>Tự động tính toán ngày giỗ hàng năm (quy đổi Âm lịch sang Dương lịch) và gửi thông báo nhắc lịch cho con cháu.</li>
                    <li>Tính toán vai vế xưng hô chính xác chuẩn phong tục cổ truyền Việt Nam.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#68ef3f]" />
                    3. Quyền Của Người Dùng & Yêu Cầu Xóa Dữ Liệu (Right to be Forgotten)
                  </h3>
                  <p>
                    Căn cứ Điều 9 Nghị định 13/2023/NĐ-CP và Điều 17 GDPR, người dùng có toàn quyền:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li><strong className="text-white">Quyền được biết & chỉnh sửa:</strong> Bạn có thể tra cứu, chỉnh sửa thông tin bất cứ lúc nào trong bảng điều khiển.</li>
                    <li><strong className="text-white">Quyền yêu cầu xóa tài khoản:</strong> Bạn có quyền tự đóng tài khoản bất kỳ lúc nào tại mục "Hồ Sơ Cá Nhân". Hệ thống cung cấp thời gian ân hạn 30 ngày để khôi phục trước khi toàn bộ dữ liệu bị xóa vĩnh viễn khỏi máy chủ.</li>
                    <li><strong className="text-white">Quyền rút lại sự đồng ý:</strong> Bạn có thể thu hồi quyền sử dụng cookie hoặc yêu cầu xóa dữ liệu bằng cách liên hệ ban quản trị.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#68ef3f]" />
                    4. Khai Báo Sử Dụng Dịch Vụ Bên Tiếp Theo (Third-party Services)
                  </h3>
                  <p>
                    Famlykin sử dụng các nhà cung cấp hạ tầng bảo mật hàng đầu:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li><strong className="text-white">Firebase Auth (Google):</strong> Quản lý danh tính và liên kết đăng nhập an toàn.</li>
                    <li><strong className="text-white">Cloudflare:</strong> Bảo vệ chống tấn công từ chối dịch vụ (DDoS) và mã hóa truyền dẫn HTTPS.</li>
                    <li><strong className="text-white">Google Analytics (Nếu được bạn cho phép):</strong> Phân tích lưu lượng ẩn danh. Hệ thống mặc định chặn toàn bộ script tracking này cho đến khi bạn chủ động ấn "Đồng ý" tại Cookie Banner.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#68ef3f]" />
                    5. Tuân Thủ GDPR (Châu Âu) & CCPA (California - Hoa Kỳ)
                  </h3>
                  <p>
                    Đối với kiều bào sinh sống tại EU: Hệ thống chỉ nạp cookie phân tích khi có sự đồng ý chủ động (Opt-in). Đối với kiều bào tại California: Famlykin cam kết "Không bán hoặc chia sẻ thông tin cá nhân của bạn" (Do Not Sell/Share My Personal Information).
                  </p>
                </div>
              </div>
            )}

            {/* 2. TERMS TAB */}
            {activeTab === 'TERMS' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#68ef3f]" />
                    1. Quyền Sở Hữu Tuyệt Đối Của Gia Đình
                  </h3>
                  <p>
                    Cây gia phả, hình ảnh tổ tiên và các ghi chú dòng họ hoàn toàn thuộc quyền sở hữu của bạn và gia đình. Famlykin không sở hữu cũng như không bao giờ bán bản quyền dữ liệu này.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#68ef3f]" />
                    2. Trách Nhiệm Của Trưởng Tộc & Người Quản Trị Nhánh
                  </h3>
                  <p>
                    Người tạo cây phả hệ (Trưởng tộc) chịu trách nhiệm về tính xác thực của thông tin khi mời thành viên tham gia cộng tác. Trưởng tộc có quyền phân quyền: Quản trị viên (Editor), Người đóng góp (Contributor) hoặc Khách xem (Viewer).
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#68ef3f]" />
                    3. Tiêu Chuẩn Cộng Đồng & Thuần Phong Mỹ Tục
                  </h3>
                  <p>
                    Nghiêm cấm đăng tải các nội dung thù địch, xúc phạm danh dự tổ tiên, thông tin xuyên tạc lịch sử hoặc vi phạm pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Các tài khoản vi phạm sẽ bị đình chỉ ngay lập tức.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-[#68ef3f]" />
                    4. Sao Lưu & Bảo Đảm Dịch Vụ
                  </h3>
                  <p>
                    Chúng tôi thực hiện sao lưu định kỳ trên hệ thống điện toán đám mây. Đồng thời cung cấp tính năng Xuất file Excel và Xuất ảnh chất lượng cao để dòng họ có thể lưu trữ offline vĩnh viễn.
                  </p>
                </div>
              </div>
            )}

            {/* 3. COOKIE TAB */}
            {activeTab === 'COOKIE' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#122314] border border-[#273f2b] text-[#68ef3f]">
                  <h2 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
                    <Cookie size={20} className="text-[#68ef3f]" />
                    <span>Chính Sách Cookie Riêng Biệt & Cơ Chế Chặn Trước Khi Đồng Ý</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Famlykin tôn trọng tuyệt đối quyền kiểm soát dữ liệu duyệt web của bạn. Hệ thống tuân thủ nguyên tắc "Chặn theo dõi trước khi có sự đồng ý" (Zero tracking before consent).
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Cookie size={18} className="text-[#68ef3f]" />
                    1. Cookie Là Gì?
                  </h3>
                  <p>
                    Cookie và LocalStorage là các tệp văn bản nhỏ được lưu trên trình duyệt của bạn nhằm giúp ứng dụng ghi nhớ phiên đăng nhập, cấu hình hiển thị và đảm bảo an toàn truy cập.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Cookie size={18} className="text-[#68ef3f]" />
                    2. Phân Loại Cookie Famlykin Sử Dụng
                  </h3>
                  <div className="space-y-3 mt-3">
                    <div className="p-4 rounded-xl bg-[#070e09] border border-[#273f2b]">
                      <strong className="text-[#68ef3f] text-sm">Cookie Thiết Yếu (Bắt Buộc):</strong>
                      <p className="mt-1 text-slate-300">
                        Bao gồm JWT Token xác thực đăng nhập, cài đặt nhánh cây đang xem, mã phòng chống tấn công CSRF. Không chứa thông tin theo dõi thương mại.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070e09] border border-[#273f2b]">
                      <strong className="text-cyan-400 text-sm">Cookie Phân Tích (Chỉ nạp khi bạn bấm Đồng ý):</strong>
                      <p className="mt-1 text-slate-300">
                        Giúp ban quản trị nắm bắt số lượng người dùng xem cây, hiệu năng tải trang trên di động. Dữ liệu được Google Analytics ẩn danh IP trước khi ghi nhận.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Cookie size={18} className="text-[#68ef3f]" />
                    3. Cách Người Dùng Quản Lý Hoặc Xóa Cookie
                  </h3>
                  <p>
                    Bạn có thể thay đổi tùy chọn bất kỳ lúc nào tại chân trang web bằng cách nhấn vào nút "Cài đặt Cookie" hoặc chủ động xóa lịch sử duyệt web trên trình duyệt Chrome, Safari, Firefox.
                  </p>
                </div>
              </div>
            )}

            {/* 4. REFUND TAB */}
            {activeTab === 'REFUND' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#122314] border border-[#273f2b] text-[#68ef3f]">
                  <h2 className="font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
                    <RefreshCw size={20} className="text-[#68ef3f]" />
                    <span>Chính Sách Hoàn Tiền Gói Hội Viên & Bảo Vệ Quyền Lợi Người Tiêu Dùng</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Famlykin áp dụng cam kết hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn không hài lòng về chất lượng tính năng nâng cao.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw size={18} className="text-[#68ef3f]" />
                    1. Điều Kiện Áp Dụng Hoàn Tiền (7 Ngày Đầu Tiên)
                  </h3>
                  <p>
                    Người dùng đăng ký các gói Trưởng Tộc hoặc Dòng Họ Trọn Đời được hoàn trả 100% phí dịch vụ trong các trường hợp sau:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li>Phát sinh sự cố kỹ thuật nghiêm trọng trên website mà đội ngũ kỹ thuật không thể khắc phục trong vòng 48 giờ.</li>
                    <li>Phát sinh giao dịch thanh toán trùng lặp do lỗi cổng thanh toán hoặc ngân hàng.</li>
                    <li>Tính năng nâng cao không đúng với mô tả trên bảng giá dịch vụ.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw size={18} className="text-[#68ef3f]" />
                    2. Các Trường Hợp Không Áp Dụng Hoàn Tiền
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-300">
                    <li>Yêu cầu hoàn tiền sau khi đã sử dụng dịch vụ vượt quá 7 ngày kể từ thời điểm nâng cấp thành công.</li>
                    <li>Tài khoản bị khóa do cố tình vi phạm Điều khoản dịch vụ hoặc tải lên nội dung phản cảm, vi phạm pháp luật.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw size={18} className="text-[#68ef3f]" />
                    3. Quy Trình & Thời Gian Xử Lý Hoàn Tiền
                  </h3>
                  <p>
                    Để yêu cầu hoàn tiền, quý khách chỉ cần gửi email về địa chỉ hỗ trợ chính thức của Famlykin kèm mã hóa đơn thanh toán. Tiền hoàn sẽ được chuyển khoản trực tiếp về tài khoản ngân hàng của quý khách trong vòng 3 đến 5 ngày làm việc.
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      {/* 4. Footer Đồng Bộ Có Background Nền Cội Nguồn */}
      <footer className="relative border-t border-[#273f2b] bg-[#070e09] py-12 px-4 sm:px-6 text-xs text-slate-400 overflow-hidden">
        {/* Nền Footer Cội Nguồn Mờ Ảo */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
          <picture>
            <source srcSet="/images/footer-bg.webp" type="image/webp" />
            <img
              src="/images/footer-bg.png"
              alt="Background cội nguồn dòng họ"
              className="w-full h-full object-cover object-center"
            />
          </picture>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070e09] via-[#070e09]/80 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <FamilyTreeLogo size={24} />
            <span>© {new Date().getFullYear()} Famlykin. Tuân thủ Nghị định 13/2023/NĐ-CP & GDPR.</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => handleTabChange('PRIVACY')} className="hover:text-[#68ef3f] transition-colors cursor-pointer">Bảo mật</button>
            <span>•</span>
            <button type="button" onClick={() => handleTabChange('TERMS')} className="hover:text-[#68ef3f] transition-colors cursor-pointer">Điều khoản</button>
            <span>•</span>
            <button type="button" onClick={() => handleTabChange('COOKIE')} className="hover:text-[#68ef3f] transition-colors cursor-pointer">Cookie</button>
            <span>•</span>
            <button type="button" onClick={() => handleTabChange('REFUND')} className="hover:text-[#68ef3f] transition-colors cursor-pointer">Hoàn tiền</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
