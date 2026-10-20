import React, { useEffect } from 'react';
import { X, BookOpen, Compass, ZoomIn, Heart, Flame, Download, UserPlus } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="minimal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ zIndex: 11000 }}>
      <div
        className="minimal-modal-box"
        style={{ maxWidth: '620px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f0fdf4, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Hướng Dẫn Sử Dụng Cây Gia Phả Số
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Cẩm nang tra cứu và kết nối thế hệ dòng họ
              </p>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} aria-label="Đóng hướng dẫn">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}
        >
          {/* Guide Item 1 */}
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                1. Đổi Góc Nhìn Vai Vế Thông Minh
              </strong>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Nhấn vào ô <strong>"Vai vế: [Tên]"</strong> ở thanh trên để chọn xem cây từ góc nhìn của bạn, con cháu hay các cụ. Danh xưng (Ông, Bà, Bác, Chú, Cô, Cậu, Dì, Cháu...) sẽ tự động thay đổi chính xác theo quan hệ tiếng Việt.
              </p>
            </div>
          </div>

          {/* Guide Item 2 */}
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ZoomIn size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                2. Kéo Thả & Thu Phóng Mượt Mà
              </strong>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                - <strong>Trên máy tính:</strong> Giữ chuột trái kéo để di chuyển (Pan), lăn bánh xe chuột để phóng to/thu nhỏ vào vị trí con trỏ.
                <br />
                - <strong>Trên điện thoại:</strong> Vuốt một ngón tay để kéo xem các thế hệ, chụm hai ngón để thu phóng mượt mà. Bấm nút <strong>"Căn vừa"</strong> ở góc dưới để gom gọn cây vào màn hình bất cứ lúc nào.
              </p>
            </div>
          </div>

          {/* Guide Item 3 */}
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fff1f2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                3. Xem Chi Tiết & Gọi Điện Trực Tiếp
              </strong>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Chạm vào thẻ bất kỳ người nào để mở hồ sơ: xem tuổi, ngày sinh, danh sách người thân, gọi điện thoại trực tiếp hoặc mở bản đồ chỉ đường đến phần mộ.
              </p>
            </div>
          </div>

          {/* Guide Item 4 */}
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                4. Tra Cứu Lịch Giỗ Âm Lịch & Mộ Phần
              </strong>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Hệ thống tự động quy đổi ngày giỗ Âm lịch sang ngày Dương lịch năm nay và hiển thị đếm ngược <em>"Còn X ngày nữa"</em> để con cháu tề tựu cúng giỗ đúng ngày.
              </p>
            </div>
          </div>

          {/* Guide Item 5 */}
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ccfbf1',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Download size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                5. Tải Ảnh Gia Phả & Xuất Danh Bạ Excel
              </strong>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Trong Menu 3 gạch, bạn có thể xuất toàn bộ cây gia phả ra file ảnh HD sắc nét để in ấn, hoặc tải file Excel danh bạ họ hàng kèm số điện thoại và địa chỉ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ minHeight: '38px', padding: '0.4rem 1.2rem' }}>
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
