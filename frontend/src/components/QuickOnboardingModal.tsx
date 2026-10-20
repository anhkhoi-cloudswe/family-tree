import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Users,
  Heart,
  Baby,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Person, FamilyTree, User as AuthUser } from '../types';
import { apiCreatePerson, apiUpdatePerson } from '../services/api';
import { useToast } from './Toast';

interface QuickOnboardingModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  mePerson: Person | null;
  tree: FamilyTree | null;
  onClose: () => void;
  onCompleted: () => void;
}

export const QuickOnboardingModal: React.FC<QuickOnboardingModalProps> = ({
  isOpen,
  user,
  mePerson,
  tree,
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Step 1: Bản thân
  const [myName, setMyName] = useState(
    mePerson?.fullName || user?.fullName || ''
  );
  const [myGender, setMyGender] = useState<'MALE' | 'FEMALE'>(
    (mePerson?.gender as 'MALE' | 'FEMALE') || 'MALE'
  );
  const [myBirthYear, setMyBirthYear] = useState('');

  // Step 2: Cha & Mẹ
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  // Step 3: Vợ/Chồng & Con
  const [spouseName, setSpouseName] = useState('');
  const [childName, setChildName] = useState('');

  if (!isOpen || !tree || !mePerson) return null;

  const handleSkip = () => {
    localStorage.setItem('fam3_quick_setup_completed', 'true');
    onClose();
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      // 1. Cập nhật thông tin của Tôi
      const updateData: any = {};
      if (myName.trim()) updateData.fullName = myName.trim();
      updateData.gender = myGender;
      if (myBirthYear.trim()) {
        const year = parseInt(myBirthYear.trim(), 10);
        if (!isNaN(year) && year > 1900 && year < 2100) {
          updateData.birthDate = new Date(year, 0, 1).toISOString();
        }
      }
      await apiUpdatePerson(mePerson.id, updateData);

      // 2. Thêm Bố (nếu có)
      let createdFatherId: string | null = null;
      if (fatherName.trim()) {
        const f = await apiCreatePerson({
          treeId: tree.id,
          fullName: fatherName.trim(),
          gender: 'MALE',
          childId: mePerson.id,
          nickname: 'Bố',
        });
        createdFatherId = f.id;
      }

      // 3. Thêm Mẹ (nếu có)
      if (motherName.trim()) {
        await apiCreatePerson({
          treeId: tree.id,
          fullName: motherName.trim(),
          gender: 'FEMALE',
          childId: mePerson.id,
          spouseId: createdFatherId || undefined,
          nickname: 'Mẹ',
        });
      }

      // 4. Thêm Bạn đời (nếu có)
      let createdSpouseId: string | null = null;
      if (spouseName.trim()) {
        const sp = await apiCreatePerson({
          treeId: tree.id,
          fullName: spouseName.trim(),
          gender: myGender === 'MALE' ? 'FEMALE' : 'MALE',
          spouseId: mePerson.id,
          nickname: myGender === 'MALE' ? 'Vợ' : 'Chồng',
        });
        createdSpouseId = sp.id;
      }

      // 5. Thêm Con cái (nếu có)
      if (childName.trim()) {
        await apiCreatePerson({
          treeId: tree.id,
          fullName: childName.trim(),
          gender: 'MALE',
          parentId: mePerson.id,
          nickname: 'Con',
        });
      }

      localStorage.setItem('fam3_quick_setup_completed', 'true');
      toast.success('Khởi tạo nhánh gia đình trực hệ thành công!');
      onCompleted();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khởi tạo nhanh phả hệ:', err);
      toast.error('Có lỗi xảy ra khi tạo các nhánh: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #092116 0%, #03140d 100%)',
          border: '1.5px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.25)',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Close / Skip button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title="Để sau / Bỏ qua"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.22)',
              border: '1.5px solid rgba(52, 211, 153, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.65rem',
              color: '#34d399',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            Thiết Lập Nhanh Nhánh Gia Đình
          </h3>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
            Điền nhanh người thân để tự động sinh ra cây phả hệ trực quan
          </p>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: step === s ? 1 : step > s ? 0.8 : 0.4,
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: step >= s ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  color: step >= s ? '#ffffff' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: step === s ? '#6ee7b7' : '#94a3b8' }}>
                {s === 1 ? 'Bản thân' : s === 2 ? 'Cha & Mẹ' : 'Gia đình nhỏ'}
              </span>
              {s < 3 && <div style={{ width: '20px', height: '1.5px', background: 'rgba(255, 255, 255, 0.15)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Bản thân */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                Họ và Tên của Bạn (*)
              </label>
              <input
                type="text"
                className="form-input-clean"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  Giới tính
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setMyGender('MALE')}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${myGender === 'MALE' ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
                      background: myGender === 'MALE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: myGender === 'MALE' ? '#a7f3d0' : '#cbd5e1',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyGender('FEMALE')}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${myGender === 'FEMALE' ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)'}`,
                      background: myGender === 'FEMALE' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: myGender === 'FEMALE' ? '#fecdd3' : '#cbd5e1',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Nữ
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  Năm sinh (tùy chọn)
                </label>
                <input
                  type="number"
                  className="form-input-clean"
                  value={myBirthYear}
                  onChange={(e) => setMyBirthYear(e.target.value)}
                  placeholder="Ví dụ: 1995"
                  style={{ width: '100%', padding: '0.55rem 0.85rem' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cha & Mẹ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
              Nhập tên Bố và Mẹ của bạn. Bạn có thể để trống nếu muốn cập nhật sau.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                Họ và Tên Bố (Cha ruột)
              </label>
              <input
                type="text"
                className="form-input-clean"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                Họ và Tên Mẹ (Mẹ ruột)
              </label>
              <input
                type="text"
                className="form-input-clean"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Ví dụ: Trần Thị Lan"
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Gia đình nhỏ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
              Nhập thêm Bạn đời và Con cái (nếu có). Bạn có thể để trống nếu chưa lập gia đình.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                Họ và Tên {myGender === 'MALE' ? 'Vợ' : 'Chồng'} (Bạn đời)
              </label>
              <input
                type="text"
                className="form-input-clean"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                placeholder={`Ví dụ: ${myGender === 'MALE' ? 'Lê Thị Thu' : 'Trần Quốc Tuấn'}`}
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#cbd5e1' }}>
                Họ và Tên Con Cái (Đời sau)
              </label>
              <input
                type="text"
                className="form-input-clean"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Khang"
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                color: '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} />
              Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.84rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Để tôi tự thêm sau
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !myName.trim()) {
                  toast.error('Vui lòng nhập Họ và Tên của bạn');
                  return;
                }
                setStep((prev) => (prev + 1) as 2 | 3);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.25rem',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              }}
            >
              Tiếp tục
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.4rem',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
              }}
            >
              {isSubmitting ? 'Đang tạo nhánh...' : 'Hoàn Tất & Khởi Tạo Nhánh Cây'}
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
