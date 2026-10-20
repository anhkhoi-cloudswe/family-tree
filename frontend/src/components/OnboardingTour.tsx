import React, { useState } from 'react';
import {
  Compass,
  UserPlus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAddMember: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onStartAddMember,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Chào Mừng Bạn Đến Với Fam3!',
      subtitle: 'Không gian phả hệ số không giới hạn',
      desc: 'Fam3 giúp kết nối các thế hệ dòng họ trên một mặt phẳng số tương tác trực quan. Bạn có thể giữ chuột trái kéo để di chuyển (Pan) và lăn bánh xe chuột để phóng to/thu nhỏ (Zoom) tự do trên mọi thiết bị.',
      icon: <Sparkles size={28} color="#fef08a" />,
      accentColor: '#10b981',
      badge: 'BƯỚC 1 / 4',
      pointerDirection: 'none',
      tip: 'Mẹo: Bấm nút "Căn vừa" ở góc dưới bên phải màn hình bất cứ lúc nào để gom gọn toàn bộ cây.',
    },
    {
      title: 'Khởi Tạo Thành Viên & Cội Nguồn',
      subtitle: 'Xây dựng từ Thủy Tổ hoặc Bản Thân bạn',
      desc: 'Bắt đầu bằng cách nhấn nút "+ Thêm" (trên thanh điều hướng hoặc giữa màn hình). Bạn có thể khởi tạo Cụ Thủy Tổ (Đời 1) hoặc bắt đầu từ chính Bạn, sau đó liên kết cha mẹ, vợ chồng và con cái dễ dàng.',
      icon: <UserPlus size={28} color="#34d399" />,
      accentColor: '#10b981',
      badge: 'BƯỚC 2 / 4',
      pointerDirection: 'top-right',
      tip: 'Mẹo: Nhập đầy đủ thông tin ngày sinh, ngày mất và nơi an táng để hệ thống tự lập bản đồ mộ phần.',
    },
    {
      title: 'Đổi Góc Nhìn Vai Vế Thông Minh',
      subtitle: 'Tính năng danh xưng thuần Việt độc quyền',
      desc: 'Chạm vào ô "Góc nhìn vai vế" trên thanh điều hướng để đổi sang bất kỳ ai trong dòng họ. Toàn bộ danh xưng gia tộc (Ông, Bà, Bác, Chú, Cô, Cậu, Dì, Thím, Cháu...) sẽ tự động tính toán lại chuẩn xác theo phong tục Việt Nam.',
      icon: <Layers size={28} color="#38bdf8" />,
      accentColor: '#38bdf8',
      badge: 'BƯỚC 3 / 4',
      pointerDirection: 'top-center',
      tip: 'Mẹo: Rất tiện lợi cho các bạn trẻ và con cháu tra cứu xưng hô đúng mực mỗi dịp lễ tết, giỗ chạp.',
    },
    {
      title: 'Lịch Giỗ Âm Lịch & Lưu Trữ In Ấn',
      subtitle: 'Gắn kết con cháu hướng về tổ tiên',
      desc: 'Fam3 tự động quy đổi ngày giỗ Âm lịch sang ngày Dương lịch năm nay kèm thông báo đếm ngược. Bạn có thể tải ảnh cây gia phả HD sắc nét hoặc xuất danh bạ Excel để in ấn lưu truyền.',
      icon: <Calendar size={28} color="#fbbf24" />,
      accentColor: '#f59e0b',
      badge: 'BƯỚC 4 / 4',
      pointerDirection: 'top-left',
      tip: 'Mẹo: Nút "Sao chép gửi Zalo" trong Lịch Giỗ giúp bạn chia sẻ nhanh ngày giỗ cho cả họ.',
    },
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Hoàn thành tutorial
      localStorage.setItem('fam3_onboarding_completed', 'true');
      onClose();
      onStartAddMember();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('fam3_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11500,
        background: 'rgba(3, 15, 9, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={handleSkip}
    >
      <div
        className="onboarding-tour-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'rgba(10, 26, 18, 0.98)',
          borderRadius: '24px',
          border: '1.5px solid rgba(52, 211, 153, 0.4)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.25)',
          padding: '2.2rem 2.4rem',
          position: 'relative',
          color: '#f1f5f9',
          animation: 'popUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Step Indicator & Skip Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.4)',
              }}
            >
              {step.badge}
            </span>
            {/* Step Dots */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentStep ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '999px',
                    background: idx === currentStep ? '#34d399' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.5rem',
            }}
            title="Bỏ qua hướng dẫn"
          >
            <span>Bỏ qua</span>
            <X size={16} />
          </button>
        </div>

        {/* Step Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.5) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            {step.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {step.title}
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#34d399', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
              {step.subtitle}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <p
          style={{
            fontSize: '0.92rem',
            color: '#cbd5e1',
            lineHeight: 1.65,
            marginBottom: '1.3rem',
          }}
        >
          {step.desc}
        </p>

        {/* Tip Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            fontSize: '0.82rem',
            color: '#94a3b8',
            marginBottom: '1.8rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <span style={{ color: '#fef08a' }}>💡</span>
          <span>{step.tip}</span>
        </div>

        {/* Bottom Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {currentStep > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrev}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.1rem',
                fontSize: '0.88rem',
              }}
            >
              <ArrowLeft size={16} />
              <span>Quay Lại</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.72rem 1.4rem',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 size={18} />
                <span>Bắt Đầu Tạo Cây Ngay</span>
              </>
            ) : (
              <>
                <span>Tiếp Tục (Continue)</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
