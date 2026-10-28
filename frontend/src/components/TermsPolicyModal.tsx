import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, UserCheck, Database } from 'lucide-react';

interface TermsPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'TERMS' | 'PRIVACY';
}

export const TermsPolicyModal: React.FC<TermsPolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'TERMS',
}) => {
  const [activeTab, setActiveTab] = useState<'TERMS' | 'PRIVACY'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      style={{ animationDuration: '0.2s' }}
    >
      <div
        className="w-full max-w-xl bg-slate-900/95 border border-emerald-500/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Điều Khoản & Chính Sách Famlykin
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bảo vệ quyền riêng tư & dữ liệu gia phả dòng họ số hóa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('TERMS')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'TERMS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText size={15} />
            <span>Điều Khoản Dịch Vụ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRIVACY')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PRIVACY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock size={15} />
            <span>Chính Sách Quyền Riêng Tư</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          {activeTab === 'TERMS' ? (
            <>
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <Database size={16} className="text-emerald-400" />
                  <span>1. Quyền Sở Hữu Dữ Liệu Gia Phả</span>
                </div>
                <p>
                  Toàn bộ cây gia phả, thông tin tổ tiên và hồ sơ nhân khẩu do bạn tạo lập hoàn toàn thuộc quyền sở hữu của bạn và gia đình. Famlykin không sở hữu cũng như không kinh doanh nội dung phả hệ của người dùng.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <UserCheck size={16} className="text-emerald-400" />
                  <span>2. Quyền Phân Quyền & Chia Sẻ Nhánh</span>
                </div>
                <p>
                  Chỉ những người được bạn chủ động gửi liên kết mời tham gia (vai trò Người xem hoặc Biên tập viên) mới có quyền truy cập vào cây phả hệ của bạn. Bạn có thể thu hồi quyền bất kỳ lúc nào.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>3. Gói Dịch Vụ & Thanh Toán Minh Bạch</span>
                </div>
                <p>
                  Hệ thống hỗ trợ gói miễn phí tối đa 5 nhánh cây. Khi nâng cấp gói PRO qua VietQR SePay, gói cước được kích hoạt tự động theo chu kỳ lựa chọn, hoàn toàn <strong>không tự động trừ tiền âm thầm</strong> khi hết hạn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>4. Quyền Xuất & Xóa Dữ Liệu</span>
                </div>
                <p>
                  Bạn có toàn quyền xuất dữ liệu (ảnh độ phân giải cao, file bảng tính) hoặc yêu cầu xóa vĩnh viễn dữ liệu cây gia phả và tài khoản khỏi hệ thống máy chủ bất cứ khi nào bạn muốn.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <Lock size={16} className="text-emerald-400" />
                  <span>1. Mã Hóa & Bảo Mật Tuyệt Đối</span>
                </div>
                <p>
                  Mật khẩu tài khoản được băm mã hóa một chiều chuẩn cao cấp. Ngay cả đội ngũ quản trị viên cũng không thể đọc mật khẩu gốc của bạn. Phiên đăng nhập được bảo vệ qua JWT Token an toàn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <UserCheck size={16} className="text-emerald-400" />
                  <span>2. Bảo Vệ Thông Tin Người Còn Sống & Người Khuất</span>
                </div>
                <p>
                  Thông tin nhạy cảm của người còn sống (số điện thoại, địa chỉ) được che mờ an toàn trước người ngoài. Dữ liệu ngày giỗ âm lịch được sử dụng duy nhất cho mục đích tính toán lịch và nhắc nhở nội bộ dòng họ.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-100 text-[13px]">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>3. Cam Kết Không Spam & Không Chia Sẻ Bên Thứ 3</span>
                </div>
                <p>
                  Famlykin cam kết không bán, không chuyển giao danh bạ hay thông tin dòng họ cho bất kỳ công ty quảng cáo hoặc bên thứ ba nào. Email của bạn chỉ dùng để gửi thông báo xác thực và sự kiện quan trọng.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Hiệu lực từ tháng 10/2026 • Famlykin Platform
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
