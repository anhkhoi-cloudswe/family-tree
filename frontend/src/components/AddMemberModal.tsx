import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Camera, Flame, Heart, Baby, Users, ShieldAlert, Sparkles, Calendar, Info, Check, Lock, Crown } from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { apiCreatePerson, apiUploadAvatar } from '../services/api';
import { calculateLunarDeathDayFromSolar, getSolarAnniversaryForYear } from '../utils/lunarHelper';
import { getInitials } from '../utils/formatHelper';
import { useToast } from './Toast';

export type RelationType =
  | 'CHILD'
  | 'SPOUSE'
  | 'PARENT'
  | 'GRANDPARENT_PATERNAL'
  | 'GRANDPARENT_MATERNAL'
  | 'SIBLING'
  | 'INDEPENDENT';

interface AddMemberModalProps {
  tree: FamilyTree;
  relativeTarget: Person | null;
  onClose: () => void;
  onCreated: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  tree,
  relativeTarget,
  onClose,
  onCreated,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    relativeTarget ? relativeTarget.id : (tree.members[0]?.id || '')
  );

  const [relationType, setRelationType] = useState<RelationType>(
    relativeTarget ? 'CHILD' : 'CHILD'
  );

  const currentTarget = tree.members.find((m) => m.id === selectedTargetId) || null;
  const rels = tree.relationships || [];

  // 1. Phụ huynh trực tiếp của currentTarget (Bố, Mẹ)
  const targetParents = useMemo(() => {
    if (!currentTarget) return [];
    return rels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === currentTarget.id)
      .map((r) => tree.members.find((m) => m.id === r.parentId))
      .filter((m): m is Person => Boolean(m));
  }, [currentTarget, rels, tree.members]);

  const targetFather = useMemo(() => targetParents.find((p) => p.gender === 'MALE') || null, [targetParents]);
  const targetMother = useMemo(() => targetParents.find((p) => p.gender === 'FEMALE') || null, [targetParents]);
  const hasBothParents = Boolean(targetFather && targetMother);

  // 2. Bên Nội của currentTarget (Cha mẹ của Bố: Ông nội, Bà nội)
  const paternalGrandparents = useMemo(() => {
    if (!targetFather) return [];
    return rels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === targetFather.id)
      .map((r) => tree.members.find((m) => m.id === r.parentId))
      .filter((m): m is Person => Boolean(m));
  }, [targetFather, rels, tree.members]);

  const targetOngNoi = useMemo(() => paternalGrandparents.find((p) => p.gender === 'MALE') || null, [paternalGrandparents]);
  const targetBaNoi = useMemo(() => paternalGrandparents.find((p) => p.gender === 'FEMALE') || null, [paternalGrandparents]);
  const hasBothNoi = Boolean(targetOngNoi && targetBaNoi);

  // 3. Bên Ngoại của currentTarget (Cha mẹ của Mẹ: Ông ngoại, Bà ngoại)
  const maternalGrandparents = useMemo(() => {
    if (!targetMother) return [];
    return rels
      .filter((r) => r.type === 'PARENT_CHILD' && r.childId === targetMother.id)
      .map((r) => tree.members.find((m) => m.id === r.parentId))
      .filter((m): m is Person => Boolean(m));
  }, [targetMother, rels, tree.members]);

  const targetOngNgoai = useMemo(() => maternalGrandparents.find((p) => p.gender === 'MALE') || null, [maternalGrandparents]);
  const targetBaNgoai = useMemo(() => maternalGrandparents.find((p) => p.gender === 'FEMALE') || null, [maternalGrandparents]);
  const hasBothNgoai = Boolean(targetOngNgoai && targetBaNgoai);

  // Khóa giới tính nếu vai trò chỉ có thể là 1 giới tính nhất định để tránh trùng lặp
  const genderLockInfo = useMemo(() => {
    if (relationType === 'PARENT') {
      if (targetFather && !targetMother) {
        return { locked: true, gender: 'FEMALE' as const, reason: `Đã có Bố (${targetFather.fullName}). Chỉ có thể thêm Mẹ (Nữ).` };
      }
      if (targetMother && !targetFather) {
        return { locked: true, gender: 'MALE' as const, reason: `Đã có Mẹ (${targetMother.fullName}). Chỉ có thể thêm Bố (Nam).` };
      }
    }
    if (relationType === 'GRANDPARENT_PATERNAL') {
      if (targetOngNoi && !targetBaNoi) {
        return { locked: true, gender: 'FEMALE' as const, reason: `Đã có Ông nội (${targetOngNoi.fullName}). Chỉ có thể thêm Bà nội (Nữ).` };
      }
      if (targetBaNoi && !targetOngNoi) {
        return { locked: true, gender: 'MALE' as const, reason: `Đã có Bà nội (${targetBaNoi.fullName}). Chỉ có thể thêm Ông nội (Nam).` };
      }
    }
    if (relationType === 'GRANDPARENT_MATERNAL') {
      if (targetOngNgoai && !targetBaNgoai) {
        return { locked: true, gender: 'FEMALE' as const, reason: `Đã có Ông ngoại (${targetOngNgoai.fullName}). Chỉ có thể thêm Bà ngoại (Nữ).` };
      }
      if (targetBaNgoai && !targetOngNgoai) {
        return { locked: true, gender: 'MALE' as const, reason: `Đã có Bà ngoại (${targetBaNgoai.fullName}). Chỉ có thể thêm Ông ngoại (Nam).` };
      }
    }
    if (relationType === 'SPOUSE' && currentTarget) {
      const opp: 'MALE' | 'FEMALE' = currentTarget.gender === 'MALE' ? 'FEMALE' : 'MALE';
      return { locked: true, gender: opp, reason: `Bạn đời được tự động chọn giới tính khác với ${currentTarget.fullName}.` };
    }
    return { locked: false, gender: null, reason: '' };
  }, [relationType, targetFather, targetMother, targetOngNoi, targetBaNoi, targetOngNgoai, targetBaNgoai, currentTarget]);

  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    generation: currentTarget ? currentTarget.generation + 1 : 1,
    phone: '',
    address: '',
    isDeceased: false,
    birthDate: '',
    deathDate: '',
    lunarDeathDay: '',
    burialPlace: '',
    burialCoordinates: '',
    avatarUrl: '',
    biography: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tự động chuyển relationType nếu người dùng chọn loại quan hệ đã đầy đủ
  useEffect(() => {
    if (relationType === 'PARENT' && hasBothParents) {
      setRelationType('CHILD');
    } else if (relationType === 'GRANDPARENT_PATERNAL' && (hasBothNoi || !targetFather)) {
      setRelationType('CHILD');
    } else if (relationType === 'GRANDPARENT_MATERNAL' && (hasBothNgoai || !targetMother)) {
      setRelationType('CHILD');
    }
  }, [selectedTargetId, hasBothParents, hasBothNoi, hasBothNgoai, targetFather, targetMother]);

  // Cập nhật generation & nickname & gender phù hợp
  useEffect(() => {
    if (relationType === 'INDEPENDENT' || !currentTarget) {
      return;
    }

    if (relationType === 'CHILD') {
      setFormData((prev) => ({
        ...prev,
        generation: currentTarget.generation + 1,
        nickname: prev.nickname || 'Con',
      }));
    } else if (relationType === 'SPOUSE') {
      const opp = currentTarget.gender === 'MALE' ? 'FEMALE' : 'MALE';
      setFormData((prev) => ({
        ...prev,
        generation: currentTarget.generation,
        gender: opp,
        nickname: prev.nickname || (opp === 'FEMALE' ? 'Vợ' : 'Chồng'),
      }));
    } else if (relationType === 'PARENT') {
      let g: 'MALE' | 'FEMALE' = formData.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
      let nick = 'Bố';
      if (targetFather && !targetMother) {
        g = 'FEMALE';
        nick = 'Mẹ';
      } else if (targetMother && !targetFather) {
        g = 'MALE';
        nick = 'Bố';
      }
      setFormData((prev) => ({
        ...prev,
        generation: Math.max(1, currentTarget.generation - 1),
        gender: g,
        nickname: nick,
      }));
    } else if (relationType === 'GRANDPARENT_PATERNAL') {
      let g: 'MALE' | 'FEMALE' = 'MALE';
      let nick = 'Ông nội';
      if (targetOngNoi && !targetBaNoi) {
        g = 'FEMALE';
        nick = 'Bà nội';
      } else if (targetBaNoi && !targetOngNoi) {
        g = 'MALE';
        nick = 'Ông nội';
      }
      setFormData((prev) => ({
        ...prev,
        generation: Math.max(1, targetFather ? targetFather.generation - 1 : currentTarget.generation - 2),
        gender: g,
        nickname: nick,
      }));
    } else if (relationType === 'GRANDPARENT_MATERNAL') {
      let g: 'MALE' | 'FEMALE' = 'MALE';
      let nick = 'Ông ngoại';
      if (targetOngNgoai && !targetBaNgoai) {
        g = 'FEMALE';
        nick = 'Bà ngoại';
      } else if (targetBaNgoai && !targetOngNgoai) {
        g = 'MALE';
        nick = 'Ông ngoại';
      }
      setFormData((prev) => ({
        ...prev,
        generation: Math.max(1, targetMother ? targetMother.generation - 1 : currentTarget.generation - 2),
        gender: g,
        nickname: nick,
      }));
    } else if (relationType === 'SIBLING') {
      setFormData((prev) => ({
        ...prev,
        generation: currentTarget.generation,
      }));
    }
  }, [relationType, currentTarget, targetFather, targetMother, targetOngNoi, targetBaNoi, targetOngNgoai, targetBaNgoai]);

  const toast = useToast();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      setIsUploading(true);
      const url = await apiUploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
      setAvatarPreview(url);
      toast.success('Đã tải ảnh đại diện lên thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || formData.fullName.trim() === '') {
      setNameError('Vui lòng nhập Họ và Tên thành viên');
      return;
    }
    setNameError('');

    try {
      setIsSubmitting(true);
      const payload: any = {
        ...formData,
        treeId: tree.id,
      };

      if (relationType === 'CHILD' && currentTarget) {
        payload.parentId = currentTarget.id;
      } else if (relationType === 'SPOUSE' && currentTarget) {
        payload.spouseId = currentTarget.id;
      } else if (relationType === 'PARENT' && currentTarget) {
        if (hasBothParents) {
          toast.error(`"${currentTarget.fullName}" đã có đầy đủ cả Bố và Mẹ. Không thể tạo thêm để tránh trùng lặp!`);
          setIsSubmitting(false);
          return;
        }
        if (targetFather && formData.gender === 'MALE') {
          toast.error(`"${currentTarget.fullName}" đã có Bố là "${targetFather.fullName}". Không thể tạo thêm Bố nữa!`);
          setIsSubmitting(false);
          return;
        }
        if (targetMother && formData.gender === 'FEMALE') {
          toast.error(`"${currentTarget.fullName}" đã có Mẹ là "${targetMother.fullName}". Không thể tạo thêm Mẹ nữa!`);
          setIsSubmitting(false);
          return;
        }
        payload.childId = currentTarget.id;
      } else if (relationType === 'GRANDPARENT_PATERNAL' && currentTarget) {
        if (!targetFather) {
          toast.error(`Cần có Bố trước khi thêm Ông/Bà nội cho "${currentTarget.fullName}"!`);
          setIsSubmitting(false);
          return;
        }
        if (hasBothNoi) {
          toast.error(`"${currentTarget.fullName}" đã có đầy đủ cả Ông nội và Bà nội!`);
          setIsSubmitting(false);
          return;
        }
        if (targetOngNoi && formData.gender === 'MALE') {
          toast.error(`Đã có Ông nội là "${targetOngNoi.fullName}". Không thể tạo thêm Ông nội nữa!`);
          setIsSubmitting(false);
          return;
        }
        if (targetBaNoi && formData.gender === 'FEMALE') {
          toast.error(`Đã có Bà nội là "${targetBaNoi.fullName}". Không thể tạo thêm Bà nội nữa!`);
          setIsSubmitting(false);
          return;
        }
        payload.childId = targetFather.id;
      } else if (relationType === 'GRANDPARENT_MATERNAL' && currentTarget) {
        if (!targetMother) {
          toast.error(`Cần có Mẹ trước khi thêm Ông/Bà ngoại cho "${currentTarget.fullName}"!`);
          setIsSubmitting(false);
          return;
        }
        if (hasBothNgoai) {
          toast.error(`"${currentTarget.fullName}" đã có đầy đủ cả Ông ngoại và Bà ngoại!`);
          setIsSubmitting(false);
          return;
        }
        if (targetOngNgoai && formData.gender === 'MALE') {
          toast.error(`Đã có Ông ngoại là "${targetOngNgoai.fullName}". Không thể tạo thêm Ông ngoại nữa!`);
          setIsSubmitting(false);
          return;
        }
        if (targetBaNgoai && formData.gender === 'FEMALE') {
          toast.error(`Đã có Bà ngoại là "${targetBaNgoai.fullName}". Không thể tạo thêm Bà ngoại nữa!`);
          setIsSubmitting(false);
          return;
        }
        payload.childId = targetMother.id;
      } else if (relationType === 'SIBLING' && currentTarget) {
        payload.siblingId = currentTarget.id;
      }

      await apiCreatePerson(payload);
      toast.success(`Đã thêm thành viên "${formData.fullName}" vào cây gia phả!`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="minimal-modal-overlay" onClick={onClose}>
      <div
        className="minimal-modal-box"
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #eff6ff, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Thêm Thành Viên Vào Dòng Họ
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                {tree.name}
              </p>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          {/* 1. Chọn Mối Quan Hệ Với Ai */}
          <div
            style={{
              background: 'rgba(16, 36, 26, 0.75)',
              border: '1.5px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '12px',
              padding: '1.1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
                Xác định vị trí & quan hệ trong cây:
              </span>

              {tree.members.length > 0 && relationType !== 'INDEPENDENT' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Gắn với:</span>
                  <select
                    className="form-select-clean"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.84rem', maxWidth: '250px', fontWeight: 600 }}
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                  >
                    {Array.from(new Set(tree.members.map((m) => m.generation)))
                      .sort((a, b) => a - b)
                      .map((gen) => (
                        <optgroup
                          key={gen}
                          label={`Thế Hệ ${gen} (Đời ${gen})`}
                        >
                          {tree.members
                            .filter((m) => m.generation === gen)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName} {m.nickname ? `(${m.nickname})` : ''}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* 7 Action Cards for Relations (Con cái, Bạn đời, Cha/Mẹ, Ông Bà Nội, Ông Bà Ngoại, Anh Chị Em, Độc lập) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '0.45rem' }}>
              {/* Card 1: Con cái */}
              <div
                onClick={() => setRelationType('CHILD')}
                style={{
                  border: `2px solid ${relationType === 'CHILD' ? '#10b981' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'CHILD' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'CHILD' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'CHILD' ? '#6ee7b7' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Baby size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'CHILD' ? '#a7f3d0' : '#f1f5f9' }}>
                  Con Cái
                </strong>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  Đời sau (+1)
                </span>
              </div>

              {/* Card 2: Bạn đời */}
              <div
                onClick={() => setRelationType('SPOUSE')}
                style={{
                  border: `2px solid ${relationType === 'SPOUSE' ? '#f43f5e' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'SPOUSE' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'SPOUSE' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'SPOUSE' ? '#fda4af' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Heart size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'SPOUSE' ? '#fecdd3' : '#f1f5f9' }}>
                  Bạn Đời
                </strong>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  Vợ / Chồng
                </span>
              </div>

              {/* Card 3: Cha mẹ */}
              <div
                onClick={() => {
                  if (!hasBothParents) setRelationType('PARENT');
                }}
                style={{
                  border: `2px solid ${relationType === 'PARENT' ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'PARENT' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: hasBothParents ? 'not-allowed' : 'pointer',
                  opacity: hasBothParents ? 0.45 : 1,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'PARENT' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'PARENT' ? '#fde68a' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Users size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'PARENT' ? '#fef3c7' : '#f1f5f9' }}>
                  Cha / Mẹ
                </strong>
                <span style={{ fontSize: '0.63rem', color: hasBothParents ? '#ef4444' : '#94a3b8', marginTop: '0.1rem', fontWeight: hasBothParents ? 600 : 400 }}>
                  {hasBothParents ? 'Đã đủ (2/2)' : targetFather ? 'Thêm Mẹ' : targetMother ? 'Thêm Bố' : 'Đời trước (-1)'}
                </span>
              </div>

              {/* Card 4: Ông Bà Nội */}
              <div
                onClick={() => {
                  if (targetFather && !hasBothNoi) setRelationType('GRANDPARENT_PATERNAL');
                }}
                style={{
                  border: `2px solid ${relationType === 'GRANDPARENT_PATERNAL' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'GRANDPARENT_PATERNAL' ? 'rgba(139, 92, 246, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: (!targetFather || hasBothNoi) ? 'not-allowed' : 'pointer',
                  opacity: (!targetFather || hasBothNoi) ? 0.45 : 1,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'GRANDPARENT_PATERNAL' ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'GRANDPARENT_PATERNAL' ? '#c4b5fd' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Crown size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'GRANDPARENT_PATERNAL' ? '#ddd6fe' : '#f1f5f9' }}>
                  Ông/Bà Nội
                </strong>
                <span style={{ fontSize: '0.63rem', color: hasBothNoi ? '#ef4444' : !targetFather ? '#f59e0b' : '#94a3b8', marginTop: '0.1rem', fontWeight: (hasBothNoi || !targetFather) ? 600 : 400 }}>
                  {!targetFather ? 'Cần có Bố' : hasBothNoi ? 'Đã đủ (2/2)' : targetOngNoi ? 'Thêm Bà nội' : targetBaNoi ? 'Thêm Ông nội' : 'Đời (-2)'}
                </span>
              </div>

              {/* Card 5: Ông Bà Ngoại */}
              <div
                onClick={() => {
                  if (targetMother && !hasBothNgoai) setRelationType('GRANDPARENT_MATERNAL');
                }}
                style={{
                  border: `2px solid ${relationType === 'GRANDPARENT_MATERNAL' ? '#ec4899' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'GRANDPARENT_MATERNAL' ? 'rgba(236, 72, 153, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: (!targetMother || hasBothNgoai) ? 'not-allowed' : 'pointer',
                  opacity: (!targetMother || hasBothNgoai) ? 0.45 : 1,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'GRANDPARENT_MATERNAL' ? 'rgba(236, 72, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'GRANDPARENT_MATERNAL' ? '#fbcfe8' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Crown size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'GRANDPARENT_MATERNAL' ? '#fce7f3' : '#f1f5f9' }}>
                  Ông/Bà Ngoại
                </strong>
                <span style={{ fontSize: '0.63rem', color: hasBothNgoai ? '#ef4444' : !targetMother ? '#f59e0b' : '#94a3b8', marginTop: '0.1rem', fontWeight: (hasBothNgoai || !targetMother) ? 600 : 400 }}>
                  {!targetMother ? 'Cần có Mẹ' : hasBothNgoai ? 'Đã đủ (2/2)' : targetOngNgoai ? 'Thêm Bà ngoại' : targetBaNgoai ? 'Thêm Ông ngoại' : 'Đời (-2)'}
                </span>
              </div>

              {/* Card 6: Anh Chị Em ruột */}
              <div
                onClick={() => setRelationType('SIBLING')}
                style={{
                  border: `2px solid ${relationType === 'SIBLING' ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'SIBLING' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'SIBLING' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'SIBLING' ? '#bae6fd' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <UserPlus size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'SIBLING' ? '#e0f2fe' : '#f1f5f9' }}>
                  Anh Chị Em
                </strong>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  Cùng đời (0)
                </span>
              </div>

              {/* Card 7: Độc lập */}
              <div
                onClick={() => setRelationType('INDEPENDENT')}
                style={{
                  border: `2px solid ${relationType === 'INDEPENDENT' ? '#10b981' : 'rgba(255, 255, 255, 0.12)'}`,
                  background: relationType === 'INDEPENDENT' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: relationType === 'INDEPENDENT' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: relationType === 'INDEPENDENT' ? '#6ee7b7' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Sparkles size={15} />
                </div>
                <strong style={{ fontSize: '0.8rem', color: relationType === 'INDEPENDENT' ? '#a7f3d0' : '#f1f5f9' }}>
                  Độc Lập
                </strong>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  Thế hệ mới
                </span>
              </div>
            </div>

            {/* Lineage Status Summary */}
            {currentTarget && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  marginTop: '0.65rem',
                  fontSize: '0.74rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                    Phả hệ hiện tại của <span style={{ color: '#38bdf8' }}>{currentTarget.fullName}</span>:
                  </span>
                  {hasBothParents && hasBothNoi && hasBothNgoai && (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <Check size={12} /> Đầy đủ gốc phả hệ
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.35rem', color: '#cbd5e1' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Bố mẹ:</span>{' '}
                    <span style={{ color: targetFather ? '#6ee7b7' : '#f59e0b', fontWeight: targetFather ? 600 : 400 }}>
                      {targetFather ? targetFather.fullName : 'Chưa có Bố'}
                    </span>
                    {' / '}
                    <span style={{ color: targetMother ? '#fda4af' : '#f59e0b', fontWeight: targetMother ? 600 : 400 }}>
                      {targetMother ? targetMother.fullName : 'Chưa có Mẹ'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Nội:</span>{' '}
                    <span style={{ color: targetOngNoi ? '#6ee7b7' : '#94a3b8' }}>{targetOngNoi ? targetOngNoi.fullName : 'Chưa có Ông'}</span>
                    {' & '}
                    <span style={{ color: targetBaNoi ? '#fda4af' : '#94a3b8' }}>{targetBaNoi ? targetBaNoi.fullName : 'Chưa có Bà'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Ngoại:</span>{' '}
                    <span style={{ color: targetOngNgoai ? '#6ee7b7' : '#94a3b8' }}>{targetOngNgoai ? targetOngNgoai.fullName : 'Chưa có Ông'}</span>
                    {' & '}
                    <span style={{ color: targetBaNgoai ? '#fda4af' : '#94a3b8' }}>{targetBaNgoai ? targetBaNgoai.fullName : 'Chưa có Bà'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Context Summary */}
            {currentTarget && relationType !== 'INDEPENDENT' && (
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0.65rem 0 0 0', textAlign: 'center' }}>
                👉 Thêm thành viên này là{' '}
                <strong style={{ color: '#ffffff' }}>
                  {relationType === 'CHILD'
                    ? 'Con của'
                    : relationType === 'SPOUSE'
                    ? 'Bạn đời của'
                    : relationType === 'PARENT'
                    ? (formData.gender === 'MALE' ? 'Bố của' : formData.gender === 'FEMALE' ? 'Mẹ của' : 'Cha/Mẹ của')
                    : relationType === 'GRANDPARENT_PATERNAL'
                    ? (formData.gender === 'MALE' ? 'Ông nội của' : 'Bà nội của')
                    : relationType === 'GRANDPARENT_MATERNAL'
                    ? (formData.gender === 'MALE' ? 'Ông ngoại của' : 'Bà ngoại của')
                    : 'Anh/Chị/Em ruột của'}
                </strong>{' '}
                <span style={{ color: '#34d399', fontWeight: 700 }}>{currentTarget.fullName}</span>{' '}
                (Sẽ thuộc Thế hệ {formData.generation})
              </p>
            )}
          </div>

          {/* 2. Ảnh Chân Dung */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #cbd5e1',
                  }}
                />
              ) : (
                <div className="avatar-initials" style={{ width: '100%', height: '100%', fontSize: '1.5rem' }}>
                  {formData.fullName ? getInitials(formData.fullName) : 'FT'}
                </div>
              )}
              <label
                htmlFor="add-avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
                title="Chọn ảnh chân dung"
              >
                <Camera size={13} />
              </label>
              <input
                id="add-avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>Ảnh chân dung</span>
              <span>{isUploading ? 'Đang tải ảnh...' : 'Nhấn biểu tượng máy ảnh để tải ảnh lên'}</span>
            </div>
          </div>

          {/* 3. Họ và Tên (Required) */}
          <div className="form-field">
            <label className="form-label-clean">
              Họ và Tên (*)
              {nameError && (
                <span style={{ color: '#e11d48', fontSize: '0.75rem', marginLeft: '0.5rem', fontWeight: 600 }}>
                  {nameError}
                </span>
              )}
            </label>
            <input
              type="text"
              className="form-input-clean"
              style={{ borderColor: nameError ? '#e11d48' : undefined }}
              placeholder="Ví dụ: Nguyễn Văn Bình"
              required
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (e.target.value.trim()) setNameError('');
              }}
            />
          </div>

          {/* 4. Nickname & Giới tính */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-field">
              <label className="form-label-clean">Tên gọi / Biệt danh</label>
              <input
                type="text"
                className="form-input-clean"
                placeholder="Ví dụ: Chú Bình, Bé Thảo..."
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label-clean" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Giới tính</span>
                {genderLockInfo.locked && (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={10} /> Khóa theo vai trò
                  </span>
                )}
              </label>
              <select
                className="form-select-clean"
                value={formData.gender}
                disabled={genderLockInfo.locked}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                style={{
                  opacity: genderLockInfo.locked ? 0.8 : 1,
                  cursor: genderLockInfo.locked ? 'not-allowed' : 'default',
                  background: genderLockInfo.locked ? 'rgba(255, 255, 255, 0.05)' : undefined,
                }}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
              {genderLockInfo.locked && (
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {genderLockInfo.reason}
                </div>
              )}
            </div>
          </div>

          {/* 5. Thế Hệ & Tình Trạng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-field">
              <label className="form-label-clean">Thế Hệ (Đời thứ)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input-clean"
                value={formData.generation}
                onChange={(e) => setFormData({ ...formData, generation: Number(e.target.value) })}
              />
            </div>
            <div className="form-field">
              <label className="form-label-clean">Tình trạng hiện tại</label>
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

          {/* 6. Liên Hệ & Ngày Sinh */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-field">
              <label className="form-label-clean">Số điện thoại</label>
              <input
                type="text"
                className="form-input-clean"
                placeholder="0912..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label-clean">Ngày sinh (Dương lịch)</label>
              <input
                type="date"
                className="form-input-clean"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>

          {/* 7. Địa Chỉ */}
          <div className="form-field">
            <label className="form-label-clean">Địa chỉ nơi cư trú</label>
            <input
              type="text"
              className="form-input-clean"
              placeholder="Địa chỉ nhà, quận/huyện, tỉnh/thành..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* 8. Deceased details (Optional) */}
          {formData.isDeceased && (
            <div
              style={{
                padding: '1.2rem',
                borderRadius: '12px',
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1.5px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fda4af' }}>
                <Flame size={16} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Thông Tin Ngày Giỗ
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-field">
                  <label className="form-label-clean">Ngày mất (Dương lịch)</label>
                  <input
                    type="date"
                    className="form-input-clean"
                    value={formData.deathDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const calculatedLunar = calculateLunarDeathDayFromSolar(newDate);
                      setFormData((prev) => ({
                        ...prev,
                        deathDate: newDate,
                        lunarDeathDay: calculatedLunar || prev.lunarDeathDay,
                      }));
                    }}
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
                    value={formData.lunarDeathDay}
                    onChange={(e) => setFormData({ ...formData, lunarDeathDay: e.target.value })}
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

          {/* 9. Ghi chú & Tiểu sử */}
          <div className="form-field">
            <label className="form-label-clean">Tiểu sử & Ghi chú</label>
            <textarea
              className="form-textarea-clean"
              rows={2}
              placeholder="Thông tin thêm về nghề nghiệp, thành tựu..."
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
            />
          </div>

          {/* Submit Actions */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Đang thêm...' : 'Lưu Thành Viên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
