import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  MapPin,
  ExternalLink,
  Flame,
  Phone,
  Save,
  Trash2,
  UserPlus,
  Edit3,
  Eye,
  Calendar,
  Users,
  Heart,
  ChevronRight,
  Info,
  Navigation,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { apiUpdatePerson, apiDeletePerson, apiUploadAvatar } from '../services/api';
import { getKinshipToMe, getPaternalMaternalMemberIds } from '../utils/kinshipHelper';
import { calculateLunarDeathDayFromSolar, getSolarAnniversaryForYear } from '../utils/lunarHelper';
import { formatDateVN } from '../utils/dateHelper';
import { getInitials } from '../utils/formatHelper';
import { DateInputVN } from './DateInputVN';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

interface MemberDetailDrawerProps {
  person: Person | null;
  tree: FamilyTree | null;
  mePerson?: Person | null;
  onClose: () => void;
  onUpdated: () => void;
  onAddRelativeFor: (person: Person) => void;
  onSelectPerson?: (person: Person) => void;
  onBack?: () => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  person,
  tree,
  mePerson,
  onClose,
  onUpdated,
  onAddRelativeFor,
  onSelectPerson,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (person) {
      setFormData({
        fullName: person.fullName,
        nickname: person.nickname || '',
        gender: person.gender,
        generation: person.generation,
        phone: person.phone || '',
        address: person.address || '',
        isDeceased: person.isDeceased,
        birthDate: person.birthDate ? person.birthDate.split('T')[0] : '',
        deathDate: person.deathDate ? person.deathDate.split('T')[0] : '',
        lunarDeathDay: person.lunarDeathDay || '',
        burialPlace: person.burialPlace || '',
        burialCoordinates: person.burialCoordinates || '',
        avatarUrl: person.avatarUrl || '',
        biography: person.biography || '',
        relativeOrder: person.relativeOrder || '',
      });
      setAvatarPreview(person.avatarUrl || '');
      setIsEditing(false);
      setNameError('');
    }
  }, [person]);

  // Lock scroll and handle Esc key
  useEffect(() => {
    if (!person) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [person, showDeleteConfirm, onClose]);

  if (!person) return null;

  // Tính tuổi
  const calculateAge = () => {
    if (!person.birthDate) return null;
    const birthYear = new Date(person.birthDate).getFullYear();
    if (isNaN(birthYear)) return null;

    if (person.isDeceased) {
      if (person.deathDate) {
        const deathYear = new Date(person.deathDate).getFullYear();
        if (!isNaN(deathYear)) {
          return `Hưởng thọ ${deathYear - birthYear} tuổi`;
        }
      }
      return 'Đã khuất';
    } else {
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    }
  };

  // Tính vai vế so với người đang xem
  const kinshipTitle = tree
    ? getKinshipToMe(mePerson || null, person, tree.members, tree.relationships)
    : 'Người thân';

  // Tự động nhận diện thế hệ và nhánh gia đình ruột thịt của người đang xem/chỉnh sửa
  const relativeOptions = useMemo(() => {
    if (!tree || !person) return [];

    const isMe =
      person.id === mePerson?.id ||
      person.nickname === 'Tôi' ||
      person.nickname === 'Tôi (Khởi tạo)';
    if (isMe) return [];

    const currentGen = formData.generation || person.generation || 1;
    const meGen = mePerson?.generation || 3;
    const genDiff = currentGen - meGen;

    const { paternalMemberIds, maternalMemberIds } = getPaternalMaternalMemberIds(
      mePerson,
      tree.members,
      tree.relationships
    );

    const isPat = paternalMemberIds.has(person.id);
    const isMat = maternalMemberIds.has(person.id);

    // Cùng thế hệ với Cha Mẹ (genDiff === -1, ví dụ Đời 2)
    if (genDiff === -1) {
      if (isMat && !isPat) {
        return [
          { value: '', label: 'Tự động (Theo năm sinh)' },
          { value: 'MOTHER_OLDER', label: 'Lớn hơn Mẹ (Bậc Bác)' },
          { value: 'MOTHER_YOUNGER', label: 'Nhỏ hơn Mẹ (Bậc Cậu / Dì)' },
        ];
      }
      if (isPat && !isMat) {
        return [
          { value: '', label: 'Tự động (Theo năm sinh)' },
          { value: 'FATHER_OLDER', label: 'Lớn hơn Cha (Bậc Bác)' },
          { value: 'FATHER_YOUNGER', label: 'Nhỏ hơn Cha (Bậc Chú / Cô)' },
        ];
      }
      return [
        { value: '', label: 'Tự động (Theo năm sinh)' },
        { value: 'FATHER_OLDER', label: 'Lớn hơn Cha (Bên nội - Bác ruột)' },
        { value: 'FATHER_YOUNGER', label: 'Nhỏ hơn Cha (Bên nội - Chú / Cô)' },
        { value: 'MOTHER_OLDER', label: 'Lớn hơn Mẹ (Bên ngoại - Bác ruột)' },
        { value: 'MOTHER_YOUNGER', label: 'Nhỏ hơn Mẹ (Bên ngoại - Cậu / Dì)' },
      ];
    }

    // Cùng thế hệ với Tôi (genDiff === 0, ví dụ Đời 3)
    if (genDiff === 0) {
      return [
        { value: '', label: 'Tự động (Theo năm sinh)' },
        { value: 'ME_OLDER', label: 'Lớn hơn Tôi (Bậc Anh / Chị)' },
        { value: 'ME_YOUNGER', label: 'Nhỏ hơn Tôi (Bậc Em)' },
      ];
    }

    // Cùng thế hệ với Ông Bà (genDiff === -2, ví dụ Đời 1)
    if (genDiff === -2) {
      if (isMat && !isPat) {
        return [
          { value: '', label: 'Tự động (Theo năm sinh)' },
          { value: 'MATERNAL_GF_OLDER', label: 'Lớn hơn Ông/Bà ngoại (Ông Bác / Bà Bác ngoại)' },
          { value: 'MATERNAL_GF_YOUNGER', label: 'Nhỏ hơn Ông/Bà ngoại (Ông Cậu / Bà Dì)' },
        ];
      }
      if (isPat && !isMat) {
        return [
          { value: '', label: 'Tự động (Theo năm sinh)' },
          { value: 'PATERNAL_GF_OLDER', label: 'Lớn hơn Ông/Bà nội (Ông Bác / Bà Bác nội)' },
          { value: 'PATERNAL_GF_YOUNGER', label: 'Nhỏ hơn Ông/Bà nội (Ông Chú / Bà Cô)' },
        ];
      }
      return [
        { value: '', label: 'Tự động (Theo năm sinh)' },
        { value: 'PATERNAL_GF_OLDER', label: 'Lớn hơn Ông/Bà nội (Bên nội)' },
        { value: 'PATERNAL_GF_YOUNGER', label: 'Nhỏ hơn Ông/Bà nội (Bên nội)' },
        { value: 'MATERNAL_GF_OLDER', label: 'Lớn hơn Ông/Bà ngoại (Bên ngoại)' },
        { value: 'MATERNAL_GF_YOUNGER', label: 'Nhỏ hơn Ông/Bà ngoại (Bên ngoại)' },
      ];
    }

    return [
      { value: '', label: 'Tự động (Theo năm sinh)' },
      { value: 'OLDER', label: 'Lớn tuổi hơn (Bề trên)' },
      { value: 'YOUNGER', label: 'Nhỏ tuổi hơn (Bề dưới)' },
    ];
  }, [tree, person, mePerson, formData.generation]);

  // Quyền chỉnh sửa (chỉ OWNER và EDITOR được phép sửa/thêm/xóa thành viên)
  const isCanEdit = !tree?.userRole || tree.userRole === 'OWNER' || tree.userRole === 'EDITOR';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      setIsUploading(true);
      const uploadedUrl = await apiUploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
      setAvatarPreview(uploadedUrl);
      toast.success('Đã tải ảnh đại diện lên thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || formData.fullName.trim() === '') {
      setNameError('Vui lòng nhập họ và tên thành viên');
      return;
    }
    setNameError('');

    try {
      setIsSaving(true);
      await apiUpdatePerson(person.id, formData);
      setIsEditing(false);
      toast.success(`Đã cập nhật thông tin của "${formData.fullName}" thành công!`);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      setIsDeleting(true);
      await apiDeletePerson(person.id);
      toast.success(`Đã xóa thành viên "${person.fullName}" khỏi cây gia phả`);
      onClose();
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa thành viên');
    } finally {
      setIsDeleting(false);
    }
  };

  // Mối quan hệ gia tộc
  const rels = tree?.relationships || [];
  const parents = rels
    .filter((r) => r.type === 'PARENT_CHILD' && r.childId === person.id)
    .map((r) => tree?.members.find((m) => m.id === r.parentId))
    .filter((m): m is Person => Boolean(m));

  const children = rels
    .filter((r) => r.type === 'PARENT_CHILD' && r.parentId === person.id)
    .map((r) => tree?.members.find((m) => m.id === r.childId))
    .filter((m): m is Person => Boolean(m));

  const spouses = rels
    .filter((r) => r.type === 'SPOUSE' && (r.spouse1Id === person.id || r.spouse2Id === person.id))
    .map((r) => (r.spouse1Id === person.id ? r.spouse2Id : r.spouse1Id))
    .map((id) => tree?.members.find((m) => m.id === id))
    .filter((m): m is Person => Boolean(m));

  const siblings = (tree?.members || []).filter((m) => {
    if (m.id === person.id) return false;
    const shareParent = parents.some((p) =>
      rels.some((r) => r.type === 'PARENT_CHILD' && r.parentId === p.id && r.childId === m.id)
    );
    if (shareParent) return true;
    const directSibling = rels.some(
      (r) =>
        r.type === 'SIBLING' &&
        ((r.spouse1Id === person.id && r.spouse2Id === m.id) ||
         (r.spouse2Id === person.id && r.spouse1Id === m.id))
    );
    return directSibling;
  });

  // Link bản đồ
  const getMapLink = () => {
    if (person.burialCoordinates && person.burialCoordinates.trim() !== '') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        person.burialCoordinates.trim()
      )}`;
    }
    if (person.burialPlace && person.burialPlace.trim() !== '') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        person.burialPlace.trim()
      )}`;
    }
    if (person.address && person.address.trim() !== '') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        person.address.trim()
      )}`;
    }
    return null;
  };

  const mapLink = getMapLink();

  return (
    <>
      {/* Backdrop overlay for outside click to close */}
      <div
        className="minimal-modal-overlay"
        onClick={onClose}
        style={{ zIndex: 9900 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-person-name"
      >
        <div
          className="minimal-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="drawer-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              {onBack && (
                <button
                  type="button"
                  className="drawer-back-btn"
                  onClick={onBack}
                  title="Quay lại tác vụ trước"
                  aria-label="Quay lại tác vụ trước"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                <span className="drawer-gen-tag" style={{ alignSelf: 'flex-start', margin: 0 }}>
                  Thế hệ {person.generation || 1}
                </span>
                <span className="drawer-header-subtitle" style={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.98rem' }}>
                  Hồ Sơ Thành Viên
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {!isEditing && isCanEdit && (
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => setIsEditing(true)}
                  title="Chỉnh sửa thông tin thành viên"
                  aria-label="Chỉnh sửa thông tin"
                >
                  <Edit3 size={17} color="#34d399" />
                </button>
              )}
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={onClose}
                aria-label="Đóng bảng thông tin thành viên"
              >
                <X size={20} color="#94a3b8" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="drawer-scroll-body">
            {!isEditing ? (
              /* VIEW MODE */
              <div>
                {/* Hero Profile Card */}
                <div className="drawer-hero-profile">
                  <div className="drawer-avatar-wrap">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.fullName}
                        className="drawer-avatar-img"
                      />
                    ) : (
                      <div className="drawer-avatar-fallback">
                        {getInitials(person.fullName)}
                      </div>
                    )}

                    <span
                      className={`drawer-status-dot ${person.isDeceased ? 'deceased' : 'living'}`}
                      title={person.isDeceased ? 'Đã khuất' : 'Còn sống'}
                    />
                  </div>

                  <h2 id="drawer-person-name" className="drawer-person-title">
                    {person.fullName}
                  </h2>
                  {person.nickname && (
                    <p className="drawer-person-nickname">
                      Biệt danh: <strong>&ldquo;{person.nickname}&rdquo;</strong>
                    </p>
                  )}

                  {/* Kinship Pill with respect to Me */}
                  <div className="drawer-kinship-row">
                    <span className="drawer-kinship-badge">
                      <Sparkles size={13} style={{ marginRight: 4 }} />
                      Vai vế: <strong>{kinshipTitle}</strong>
                    </span>
                  </div>

                  {/* Status, Gender, Age Chips */}
                  <div className="drawer-chips-wrap">
                    <span className={`drawer-chip ${person.isDeceased ? 'deceased' : 'living'}`}>
                      {person.isDeceased ? 'Đã khuất' : 'Còn sống'}
                    </span>
                    <span className="drawer-chip neutral">
                      {person.gender === 'MALE' ? 'Nam' : person.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </span>
                    {calculateAge() && (
                      <span className="drawer-chip age">
                        {calculateAge()}
                      </span>
                    )}
                  </div>

                  {/* Quick Add Relative Button */}
                  {isCanEdit && (
                    <button
                      type="button"
                      className="btn-secondary drawer-add-rel-btn"
                      onClick={() => {
                        onClose();
                        onAddRelativeFor(person);
                      }}
                    >
                      <UserPlus size={16} color="#059669" />
                      <span>+ Thêm Quan Hệ Cho Người Này</span>
                    </button>
                  )}
                </div>

                {/* Details Sections */}
                <div className="drawer-sections-container">
                  {/* Ngày sinh / Ngày mất & Ngày giỗ */}
                  <div className="drawer-info-card">
                    <div className="info-card-header">
                      <Calendar size={17} color="#2563eb" />
                      <h4>
                        {person.isDeceased
                          ? (person.birthDate ? 'Năm Sinh & Ngày Giỗ' : 'Ngày Giỗ')
                          : 'Ngày Sinh'}
                      </h4>
                    </div>

                    <div className={person.isDeceased ? 'info-grid-2' : 'info-grid-1'}>
                      <div className="info-item">
                        <span className="info-label">Ngày sinh</span>
                        <span className="info-val">
                          {person.birthDate
                            ? formatDateVN(person.birthDate)
                            : 'Chưa cập nhật'}
                        </span>
                      </div>

                      {person.isDeceased && (
                        <div className="info-item">
                          <span className="info-label">Ngày mất</span>
                          <span className="info-val">
                            {person.deathDate
                              ? formatDateVN(person.deathDate)
                              : 'Chưa rõ'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ngày giỗ Âm lịch */}
                    {person.isDeceased && person.lunarDeathDay && (() => {
                      const anniversary = getSolarAnniversaryForYear(person.lunarDeathDay);
                      const cleanLunar = person.lunarDeathDay.replace(/\s*Âm\s*lịch/i, '').trim();
                      return (
                        <div className="drawer-lunar-highlight" style={{ boxSizing: 'border-box', maxWidth: '100%', alignItems: 'flex-start' }}>
                          <Flame size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="lunar-title" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)', marginBottom: '0.2rem' }}>
                              Ngày Giỗ Hàng Năm:
                            </div>
                            <div className="lunar-date" style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f43f5e', letterSpacing: '0.01em', marginBottom: '0.45rem', wordBreak: 'break-word' }}>
                              {cleanLunar} <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f87171' }}>(Âm lịch)</span>
                            </div>
                            {anniversary && (
                              <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                  <span>👉 Giỗ năm nay</span>
                                  <strong style={{ color: '#fbbf24', fontWeight: 800 }}>
                                    ({anniversary.targetSolarYear}):
                                  </strong>
                                </div>
                                <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                  <strong style={{ color: '#34d399', fontSize: '1rem', fontWeight: 800 }}>
                                    {anniversary.dateStr}
                                  </strong>
                                  <span style={{ color: '#6ee7b7', fontSize: '0.82rem', fontWeight: 500 }}>(Dương lịch)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Phần Mộ & Nơi An Táng (Nếu đã khuất) */}
                  {person.isDeceased && (person.burialPlace || person.burialCoordinates) && (
                    <div className="drawer-info-card">
                      <div className="info-card-header">
                        <MapPin size={17} color="#ea580c" />
                        <h4>Phần Mộ & Nơi An Táng</h4>
                      </div>

                      {person.burialPlace && (
                        <div className="info-item" style={{ marginBottom: '0.6rem' }}>
                          <span className="info-label">Địa điểm phần mộ</span>
                          <span className="info-val">{person.burialPlace}</span>
                        </div>
                      )}

                      {person.burialCoordinates && (
                        <div className="info-item" style={{ marginBottom: '0.6rem' }}>
                          <span className="info-label">Tọa độ GPS bản đồ</span>
                          <span className="info-val" style={{ fontFamily: 'monospace' }}>
                            {person.burialCoordinates}
                          </span>
                        </div>
                      )}

                      {mapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-map-link"
                          title="Mở vị trí phần mộ trên Google Maps"
                        >
                          <Navigation size={15} />
                          <span>Xem Chỉ Đường Trên Google Maps</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Liên lạc & Nơi cư trú (Nếu còn sống) */}
                  {!person.isDeceased && (person.phone || person.address) && (
                    <div className="drawer-info-card">
                      <div className="info-card-header">
                        <Phone size={17} color="#059669" />
                        <h4>Liên Lạc & Nơi Cư Trú</h4>
                      </div>

                      {person.phone && (
                        <div className="info-item" style={{ marginBottom: '0.6rem' }}>
                          <span className="info-label">Số điện thoại</span>
                          <a href={`tel:${person.phone}`} className="info-val phone-link">
                            {person.phone}
                          </a>
                        </div>
                      )}

                      {person.address && (
                        <div className="info-item" style={{ marginBottom: '0.6rem' }}>
                          <span className="info-label">Địa chỉ nơi ở</span>
                          <span className="info-val">{person.address}</span>
                        </div>
                      )}

                      {mapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-map-link"
                        >
                          <MapPin size={15} />
                          <span>Xem Địa Chỉ Trên Google Maps</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Quan Hệ Gia Tộc (Cha Mẹ, Vợ/Chồng, Con Cái) */}
                  <div className="drawer-info-card">
                    <div className="info-card-header">
                      <Users size={17} color="#2563eb" />
                      <h4>Quan Hệ Gia Tộc Trực Tiếp</h4>
                    </div>

                    {/* Cha Mẹ */}
                    <div className="rel-group">
                      <span className="rel-group-label">Cha / Mẹ:</span>
                      {parents.length > 0 ? (
                        <div className="rel-tags-list">
                          {parents.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="rel-member-pill"
                              onClick={() => onSelectPerson?.(p)}
                              title="Bấm để xem hồ sơ"
                            >
                              <span>{p.fullName}</span>
                              <ChevronRight size={13} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="rel-empty-text">Chưa ghi nhận trong phả hệ</span>
                      )}
                    </div>

                    {/* Vợ / Chồng */}
                    <div className="rel-group">
                      <span className="rel-group-label">Vợ / Chồng:</span>
                      {spouses.length > 0 ? (
                        <div className="rel-tags-list">
                          {spouses.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className="rel-member-pill spouse"
                              onClick={() => onSelectPerson?.(s)}
                              title="Bấm để xem hồ sơ"
                            >
                              <Heart size={13} color="#e11d48" style={{ marginRight: 3 }} />
                              <span>{s.fullName}</span>
                              <ChevronRight size={13} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="rel-empty-text">Chưa kết hôn / Chưa ghi nhận</span>
                      )}
                    </div>

                    {/* Anh / Chị / Em ruột */}
                    <div className="rel-group">
                      <span className="rel-group-label">Anh / Chị / Em ruột ({siblings.length}):</span>
                      {siblings.length > 0 ? (
                        <div className="rel-tags-list">
                          {siblings.map((sib) => (
                            <button
                              key={sib.id}
                              type="button"
                              className="rel-member-pill sibling"
                              onClick={() => onSelectPerson?.(sib)}
                              title="Bấm để xem hồ sơ"
                              style={{ borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.1)' }}
                            >
                              <Users size={13} color="#38bdf8" style={{ marginRight: 3 }} />
                              <span style={{ color: '#e0f2fe' }}>{sib.fullName}</span>
                              <ChevronRight size={13} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="rel-empty-text">Chưa ghi nhận anh chị em</span>
                      )}
                    </div>

                    {/* Con Cái */}
                    <div className="rel-group">
                      <span className="rel-group-label">Con Cái ({children.length}):</span>
                      {children.length > 0 ? (
                        <div className="rel-tags-list">
                          {children.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="rel-member-pill child"
                              onClick={() => onSelectPerson?.(c)}
                              title="Bấm để xem hồ sơ"
                            >
                              <span>{c.fullName}</span>
                              <ChevronRight size={13} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="rel-empty-text">Chưa có con cháu trong cây</span>
                      )}
                    </div>
                  </div>

                  {/* Tiểu Sử / Ghi Chú Dòng Họ */}
                  {person.biography && (
                    <div className="drawer-info-card">
                      <div className="info-card-header">
                        <Info size={17} color="#475569" />
                        <h4>Tiểu Sử & Ghi Chú Dòng Họ</h4>
                      </div>
                      <p className="drawer-bio-text">{person.biography}</p>
                    </div>
                  )}

                  {/* Delete button at bottom of drawer */}
                  {isCanEdit && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        className="btn-danger-ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={16} />
                        <span>{isDeleting ? 'Đang xóa...' : 'Xóa thành viên này khỏi cây'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSave} className="drawer-edit-form">
                {/* Avatar upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.4rem' }}>
                  <div className="drawer-avatar-wrap">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="drawer-avatar-img" />
                    ) : (
                      <div className="drawer-avatar-fallback">
                        {getInitials(formData.fullName)}
                      </div>
                    )}
                    <label className="drawer-avatar-upload-btn" title="Thay đổi ảnh đại diện">
                      <Camera size={16} color="#ffffff" />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.45rem' }}>
                    {isUploading ? 'Đang tải ảnh lên...' : 'Bấm icon máy ảnh để đổi hình đại diện'}
                  </span>
                </div>

                {/* Section 1: Thông tin định danh & Thế hệ */}
                <div className="drawer-edit-section">
                  <div className="drawer-edit-section-header">
                    <Users size={16} color="#2563eb" />
                    <h4>1. Thông Tin Cá Nhân & Thế Hệ</h4>
                  </div>

                  <div className="form-field">
                    <label className="form-label-clean">
                      Họ và tên <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-clean"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    {nameError && <span className="form-error-msg">{nameError}</span>}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label-clean">Biệt danh</label>
                      <input
                        type="text"
                        className="form-input-clean"
                        placeholder="VD: Cụ Trưởng, Bác Cả..."
                        value={formData.nickname || ''}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label-clean">Giới tính</label>
                      <select
                        className="form-select-clean"
                        value={formData.gender || 'MALE'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label-clean">Thế Hệ</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="form-input-clean"
                        value={formData.generation || 1}
                        onChange={(e) =>
                          setFormData({ ...formData, generation: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label-clean">Tình trạng</label>
                      <select
                        className="form-select-clean"
                        value={formData.isDeceased ? 'DECEASED' : 'LIVING'}
                        onChange={(e) =>
                          setFormData({ ...formData, isDeceased: e.target.value === 'DECEASED' })
                        }
                      >
                        <option value="LIVING">Còn sống</option>
                        <option value="DECEASED">Đã khuất</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin liên hệ & Sinh nhật */}
                <div className="drawer-edit-section">
                  <div className="drawer-edit-section-header">
                    <Calendar size={16} color="#0d9488" />
                    <h4>2. Ngày Sinh & Thông Tin Liên Hệ</h4>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label-clean">Ngày sinh</label>
                      <DateInputVN
                        value={formData.birthDate || ''}
                        onChange={(val) => setFormData({ ...formData, birthDate: val })}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label-clean">Số điện thoại</label>
                      <input
                        type="text"
                        className="form-input-clean"
                        placeholder="0912..."
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* So sánh vai vế tự động cùng thế hệ */}
                  {relativeOptions.length > 0 && (
                    <div className="form-field">
                      <label className="form-label-clean" title="Xác định thứ bậc so với người thân cùng thế hệ">
                        So sánh cùng thế hệ
                      </label>
                      <select
                        className="form-select-clean"
                        value={formData.relativeOrder || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, relativeOrder: e.target.value }))
                        }
                      >
                        {relativeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-field">
                    <label className="form-label-clean">Địa chỉ nơi ở / Quê quán</label>
                    <input
                      type="text"
                      className="form-input-clean"
                      placeholder="Số nhà, đường phố, tỉnh/thành..."
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section 3: Giỗ chạp (Khi đã mất) */}
                {formData.isDeceased && (
                  <div className="drawer-edit-section highlight-deceased">
                    <div className="drawer-edit-section-header">
                      <Flame size={16} color="#dc2626" />
                      <h4>3. Thông Tin Ngày Giỗ</h4>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label-clean">Ngày mất</label>
                        <DateInputVN
                          value={formData.deathDate || ''}
                          onChange={(newDate) => {
                            if (!newDate) {
                              setFormData((prev) => ({
                                ...prev,
                                deathDate: '',
                                lunarDeathDay: '',
                              }));
                            } else {
                              const calculatedLunar = calculateLunarDeathDayFromSolar(newDate);
                              setFormData((prev) => ({
                                ...prev,
                                deathDate: newDate,
                                lunarDeathDay: calculatedLunar || prev.lunarDeathDay,
                              }));
                            }
                          }}
                          placeholder="DD/MM/YYYY"
                        />
                      </div>
                      <div className="form-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="form-label-clean">Ngày giỗ (Âm lịch)</label>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tự động tính</span>
                        </div>
                        <input
                          type="text"
                          placeholder="VD: 15/07 Âm lịch"
                          className="form-input-clean"
                          value={formData.lunarDeathDay || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, lunarDeathDay: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Tự động tính ngày giỗ cho năm hiện tại */}
                    {formData.lunarDeathDay && (() => {
                      const anniversary = getSolarAnniversaryForYear(formData.lunarDeathDay);
                      if (!anniversary) return null;
                      return (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px dashed rgba(244, 63, 94, 0.4)',
                            borderRadius: '8px',
                            padding: '0.55rem 0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Calendar size={15} color="#fb7185" />
                          <span style={{ color: '#fecdd3' }}>
                            👉 <strong>Ngày giỗ năm nay ({anniversary.targetSolarYear}):</strong>{' '}
                            <span style={{ color: '#ffffff', fontWeight: 600 }}>{anniversary.dateStr}</span> (Dương lịch)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Section 4: Tiểu sử dòng họ */}
                <div className="drawer-edit-section">
                  <div className="drawer-edit-section-header">
                    <Info size={16} color="#475569" />
                    <h4>4. Tiểu Sử & Ghi Chú Dòng Họ</h4>
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <textarea
                      className="form-textarea-clean"
                      rows={3}
                      placeholder="Ghi lại công đức, sự nghiệp, kỷ niệm đáng nhớ của người thân..."
                      value={formData.biography || ''}
                      onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    />
                  </div>
                </div>

                {/* Form Footer Buttons */}
                <div className="drawer-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, minHeight: 44 }}
                    onClick={() => {
                      setIsEditing(false);
                      setNameError('');
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, minHeight: 44 }}
                    disabled={isSaving}
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa thành viên"
        message={`Bạn có chắc chắn muốn xóa thành viên "${person.fullName}" khỏi cây gia phả không? Hành động này sẽ gỡ bỏ các liên kết quan hệ trong dòng họ.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Giữ lại"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
