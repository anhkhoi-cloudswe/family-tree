import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Cookie, RefreshCw, Scale, CheckCircle2 } from 'lucide-react';

export type LegalDocTab = 'PRIVACY' | 'TERMS' | 'COOKIE' | 'REFUND';

interface LegalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalDocTab;
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'PRIVACY',
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      style={{ animationDuration: '0.2s', zIndex: 9999 }}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-emerald-500/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Scale size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Hồ Sơ Pháp Lý Famlykin
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảo vệ quyền riêng tư theo Nghị định 13/2023/NĐ-CP, GDPR & CCPA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Đóng văn kiện"
          >
            <X size={18} />
          </button>
        </div>

        {/* 4 Tabs Selector */}
        <div className="p-2 sm:px-4 flex gap-1.5 border-b border-slate-800 bg-slate-950/40 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('PRIVACY')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'PRIVACY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck size={15} />
            <span>1. Chính Sách Bảo Mật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TERMS')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'TERMS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText size={15} />
            <span>2. Điều Khoản Sử Dụng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COOKIE')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'COOKIE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cookie size={15} />
            <span>3. Chính Sách Cookie</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REFUND')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'REFUND'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <RefreshCw size={15} />
            <span>4. Chính Sách Hoàn Tiền</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-[13px] leading-relaxed text-slate-300">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                <div className="font-bold text-sm mb-1">
                  Tuân thủ Nghị định 13/2023/NĐ-CP (Việt Nam) & Chuẩn Bảo Mật Quốc Tế (GDPR / CCPA)
                </div>
                <p className="text-xs text-emerald-400/90">
                  Famlykin cam kết bảo vệ dữ liệu gia phả dòng họ thiêng liêng. Dữ liệu của bạn được mã hóa và không bao giờ bị thương mại hóa hay bán cho bên thứ ba.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  1. Nguyên Tắc Tối Giản Dữ Liệu (Data Minimization)
                </h4>
                <p>
                  Chúng tôi chỉ thu thập các dữ liệu cá nhân thật sự cần thiết để khởi tạo tài khoản và vẽ sơ đồ cây phả hệ:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Thông tin tài khoản:</strong> Họ tên, Địa chỉ Email (dùng xác thực bảo mật không cần mật khẩu Magic Link hoặc đăng nhập an toàn).</li>
                  <li><strong>Thông tin phả hệ:</strong> Họ tên thành viên, Giới tính, Thế hệ (Đời), Ngày sinh, Ngày mất/Ngày giỗ âm lịch, Nơi an táng và mối liên kết gia đình.</li>
                  <li><strong>Thông tin liên hệ bổ sung (Tùy chọn):</strong> Số điện thoại người dùng tự nguyện cung cấp để nhận diện dòng họ khi mời người thân vào cây.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  2. Mục Đích Thu Thập Dữ Liệu Rõ Ràng
                </h4>
                <p>
                  Mọi form nhập liệu trên hệ thống đều khai báo mục đích trước khi lưu trữ:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Xây dựng và số hóa cây gia phả tương tác cho gia tộc của bạn.</li>
                  <li>Tự động tính toán ngày giỗ hàng năm (quy đổi Âm lịch sang Dương lịch) và gửi thông báo nhắc lịch cho con cháu.</li>
                  <li>Tính toán vai vế xưng hô chính xác chuẩn phong tục cổ truyền Việt Nam.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  3. Quyền Của Người Dùng & Yêu Cầu Xóa Dữ Liệu (Right to be Forgotten)
                </h4>
                <p>
                  Căn cứ Điều 9 Nghị định 13/2023/NĐ-CP và Điều 17 GDPR, người dùng có toàn quyền:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Quyền được biết & chỉnh sửa:</strong> Bạn có thể tra cứu, chỉnh sửa thông tin bất cứ lúc nào trong bảng điều khiển.</li>
                  <li><strong>Quyền yêu cầu xóa tài khoản:</strong> Bạn có quyền tự đóng tài khoản bất kỳ lúc nào tại mục "Hồ Sơ Cá Nhân". Hệ thống cung cấp thời gian ân hạn 30 ngày để khôi phục trước khi toàn bộ dữ liệu bị xóa vĩnh viễn khỏi máy chủ.</li>
                  <li><strong>Quyền rút lại sự đồng ý:</strong> Bạn có thể thu hồi quyền sử dụng cookie hoặc yêu cầu xóa dữ liệu bằng cách liên hệ ban quản trị.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  4. Khai Báo Sử Dụng Dịch Vụ Bên Thứ Ba (Third-party Services)
                </h4>
                <p>
                  Famlykin sử dụng các nhà cung cấp hạ tầng bảo mật hàng đầu:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Firebase Auth (Google):</strong> Quản lý danh tính và liên kết đăng nhập an toàn.</li>
                  <li><strong>Cloudflare:</strong> Bảo vệ chống tấn công từ chối dịch vụ (DDoS) và mã hóa truyền dẫn HTTPS.</li>
                  <li><strong>Google Analytics (Nếu được bạn cho phép):</strong> Phân tích lưu lượng ẩn danh. Hệ thống mặc định chặn toàn bộ script tracking này cho đến khi bạn chủ động ấn "Đồng ý" tại Cookie Banner.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  5. Tuân Thủ GDPR (Châu Âu) & CCPA (California - Hoa Kỳ)
                </h4>
                <p>
                  Đối với kiều bào sinh sống tại EU: Hệ thống chỉ nạp cookie phân tích khi có sự đồng ý chủ động (Opt-in). Đối với kiều bào tại California: Famlykin cam kết "Không bán hoặc chia sẻ thông tin cá nhân của bạn" (Do Not Sell/Share My Personal Information).
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'TERMS' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  1. Quyền Sở Hữu Tuyệt Đối Của Gia Đình
                </h4>
                <p>
                  Cây gia phả, hình ảnh tổ tiên và các ghi chú dòng họ hoàn toàn thuộc quyền sở hữu của bạn và gia đình. Famlykin không sở hữu cũng như không bao giờ bán bản quyền dữ liệu này.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  2. Trách Nhiệm Của Trưởng Tộc & Người Quản Trị Nhánh
                </h4>
                <p>
                  Người tạo cây phả hệ (Trưởng tộc) chịu trách nhiệm về tính xác thực của thông tin khi mời thành viên tham gia cộng tác. Trưởng tộc có quyền phân quyền: Quản trị viên (Editor), Người đóng góp (Contributor) hoặc Khách xem (Viewer).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  3. Tiêu Chuẩn Cộng Đồng & Thuần Phong Mỹ Tục
                </h4>
                <p>
                  Nghiêm cấm đăng tải các nội dung thù địch, xúc phạm danh dự tổ tiên, thông tin xuyên tạc lịch sử hoặc vi phạm pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Các tài khoản vi phạm sẽ bị đình chỉ ngay lập tức.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  4. Sao Lưu & Bảo Đảm Dịch Vụ
                </h4>
                <p>
                  Chúng tôi thực hiện sao lưu định kỳ trên hệ thống điện toán đám mây. Đồng thời cung cấp tính năng Xuất file Excel và Xuất ảnh chất lượng cao để dòng họ có thể lưu trữ offline vĩnh viễn.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: COOKIE POLICY */}
          {activeTab === 'COOKIE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-300">
                <div className="font-bold text-sm mb-1">
                  Chính Sách Cookie Riêng Biệt & Cơ Chế Chặn Trước Khi Đồng Ý
                </div>
                <p className="text-xs text-blue-400/90">
                  Famlykin tôn trọng tuyệt đối quyền kiểm soát dữ liệu duyệt web của bạn. Hệ thống tuân thủ nguyên tắc "Chặn theo dõi trước khi có sự đồng ý" (Zero tracking before consent).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cookie size={16} className="text-emerald-400" />
                  1. Cookie Là Gì?
                </h4>
                <p>
                  Cookie và LocalStorage là các tệp văn bản nhỏ được lưu trên trình duyệt của bạn nhằm giúp ứng dụng ghi nhớ phiên đăng nhập, cấu hình hiển thị và đảm bảo an toàn truy cập.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cookie size={16} className="text-emerald-400" />
                  2. Phân Loại Cookie Famlykin Sử Dụng
                </h4>
                <div className="space-y-2 mt-2">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <strong className="text-emerald-400">Cookie Thiết Yếu (Bắt Buộc):</strong>
                    <p className="text-slate-300 mt-1">
                      Bao gồm JWT Token xác thực đăng nhập, cài đặt nhánh cây đang xem, mã phòng chống tấn công CSRF. Không chứa thông tin theo dõi thương mại.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <strong className="text-cyan-400">Cookie Phân Tích (Chỉ nạp khi bạn bấm Đồng ý):</strong>
                    <p className="text-slate-300 mt-1">
                      Giúp ban quản trị nắm bắt số lượng người dùng xem cây, hiệu năng tải trang trên di động. Dữ liệu được Google Analytics ẩn danh IP trước khi ghi nhận.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cookie size={16} className="text-emerald-400" />
                  3. Cách Người Dùng Quản Lý Hoặc Xóa Cookie
                </h4>
                <p>
                  Bạn có thể thay đổi tùy chọn bất kỳ lúc nào tại chân trang web bằng cách nhấn vào nút "Cài đặt Cookie" hoặc chủ động xóa lịch sử duyệt web trên Chrome, Safari, Firefox.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: REFUND POLICY */}
          {activeTab === 'REFUND' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300">
                <div className="font-bold text-sm mb-1">
                  Chính Sách Hoàn Tiền Gói Hội Viên & Bảo Vệ Quyền Lợi Người Tiêu Dùng
                </div>
                <p className="text-xs text-amber-400/90">
                  Famlykin áp dụng cam kết hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn không hài lòng về chất lượng tính năng nâng cao.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-400" />
                  1. Điều Kiện Áp Dụng Hoàn Tiền (7 Ngày Đầu Tiên)
                </h4>
                <p>
                  Người dùng đăng ký các gói Trưởng Tộc hoặc Dòng Họ Trọn Đời được hoàn trả 100% phí dịch vụ trong các trường hợp sau:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Phát sinh sự cố kỹ thuật nghiêm trọng trên website mà đội ngũ kỹ thuật không thể khắc phục trong vòng 48 giờ.</li>
                  <li>Phát sinh giao dịch thanh toán trùng lặp do lỗi cổng thanh toán hoặc ngân hàng.</li>
                  <li>Tính năng nâng cao không đúng với mô tả trên bảng giá dịch vụ.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-400" />
                  2. Các Trường Hợp Không Áp Dụng Hoàn Tiền
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Yêu cầu hoàn tiền sau khi đã sử dụng dịch vụ vượt quá 7 ngày kể từ thời điểm nâng cấp thành công.</li>
                  <li>Tài khoản bị khóa do cố tình vi phạm Điều khoản dịch vụ hoặc tải lên nội dung phản cảm, vi phạm pháp luật.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-400" />
                  3. Quy Trình & Thời Gian Xử Lý Hoàn Tiền
                </h4>
                <p>
                  Để yêu cầu hoàn tiền, quý khách chỉ cần gửi email về địa chỉ hỗ trợ chính thức của Famlykin kèm mã hóa đơn thanh toán. Tiền hoàn sẽ được chuyển khoản trực tiếp về tài khoản ngân hàng của quý khách trong vòng 3 đến 5 ngày làm việc.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Hiệu lực: Cập nhật tháng 11/2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
