import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, User, History, Check, Shield, Users, Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { getKinshipToMe, getPaternalMaternalMemberIds } from '../utils/kinshipHelper';
import { getInitials } from '../utils/formatHelper';

export type PersonPickerMode = 'SEARCH' | 'PERSPECTIVE';

interface PersonPickerModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  mePerson: Person | null;
  initialMode?: PersonPickerMode;
  onSelectPerson: (person: Person) => void;
  onViewPerson?: (person: Person) => void;
  onClose: () => void;
  onResetToMe?: () => void;
}

const RECENT_KEY = 'familytree_recent_perspective_ids';

export const PersonPickerModal: React.FC<PersonPickerModalProps> = ({
  isOpen,
  tree,
  mePerson,
  initialMode = 'SEARCH',
  onSelectPerson,
  onViewPerson,
  onClose,
  onResetToMe,
}) => {
  const [mode, setMode] = useState<PersonPickerMode>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PATERNAL' | 'MATERNAL' | number>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Sync mode with initialMode when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Load recently chosen from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Determine paternal & maternal member IDs
  const { paternalMemberIds, maternalMemberIds } = useMemo(() => {
    return getPaternalMaternalMemberIds(mePerson, tree.members, tree.relationships);
  }, [tree.members, tree.relationships, mePerson]);

  // Available generation numbers
  const generations = useMemo(() => {
    const set = new Set<number>();
    tree.members.forEach((m) => set.add(m.generation || 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [tree.members]);

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const qClean = removeVietnameseTones(q);

    return tree.members.filter((person) => {
      // Search text match (both exact & unaccented)
      const name = person.fullName.toLowerCase();
      const nameClean = removeVietnameseTones(person.fullName);
      const nickname = person.nickname ? person.nickname.toLowerCase() : '';
      const nicknameClean = person.nickname ? removeVietnameseTones(person.nickname) : '';

      const nameMatch =
        name.includes(q) ||
        nameClean.includes(qClean) ||
        nickname.includes(q) ||
        nicknameClean.includes(qClean);

      if (q && !nameMatch) return false;

      // Filter tabs match
      if (filterType === 'PATERNAL') {
        return paternalMemberIds.has(person.id);
      }
      if (filterType === 'MATERNAL') {
        return maternalMemberIds.has(person.id);
      }
      if (typeof filterType === 'number') {
        return person.generation === filterType;
      }
      return true;
    });
  }, [tree.members, searchTerm, filterType, paternalMemberIds, maternalMemberIds]);

  // Recent members
  const recentMembers = useMemo(() => {
    return recentIds
      .map((id) => tree.members.find((m) => m.id === id))
      .filter((m): m is Person => Boolean(m))
      .slice(0, 4);
  }, [recentIds, tree.members]);

  const handleSelect = (person: Person) => {
    // Save to recents
    const nextRecents = [person.id, ...recentIds.filter((id) => id !== person.id)].slice(0, 5);
    setRecentIds(nextRecents);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecents));
    } catch {
      // ignore
    }

    if (mode === 'SEARCH' && onViewPerson) {
      onViewPerson(person);
    } else {
      onSelectPerson(person);
    }
    onClose();
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMembers[selectedIndex]) {
          handleSelect(filteredMembers[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredMembers, selectedIndex, onClose]);

  // Ensure active keyboard item scrolls into view
  useEffect(() => {
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="minimal-modal-overlay picker-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      style={{ zIndex: 10500 }}
    >
      <div
        className="minimal-modal-box person-picker-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull/Drag Indicator */}
        <div className="picker-drag-handle" aria-hidden="true" />

        {/* 1. Header with Mode Tabs & Search Input */}
        <div className="picker-header-wrap">
          <div className="picker-title-row">
            <div className="picker-title-content">
              <div className="picker-icon-badge" style={{ color: mode === 'SEARCH' ? '#34d399' : '#38bdf8' }}>
                {mode === 'SEARCH' ? <Search size={19} /> : <Navigation size={19} />}
              </div>
              <div className="picker-heading-text">
                <h3 id="picker-title">
                  {mode === 'SEARCH' ? 'Tìm Kiếm Thành Viên' : 'Đổi Góc Nhìn Phả Hệ'}
                </h3>
                <p>
                  {mode === 'SEARCH'
                    ? 'Tra cứu và xem hồ sơ chi tiết của thành viên'
                    : 'Chọn người thân làm tâm điểm tính xưng hô & sơ đồ'}
                </p>
              </div>
            </div>
            <button className="btn-ghost-sm" onClick={onClose} aria-label="Đóng bảng chọn">
              <X size={19} />
            </button>
          </div>

          {/* Mode Switcher: Differentiate Search vs Change Perspective clearly */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '0.25rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '0.3rem',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('SEARCH')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '9px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: mode === 'SEARCH' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid transparent',
                background: mode === 'SEARCH' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: mode === 'SEARCH' ? '#34d399' : '#94a3b8',
                transition: 'all 0.18s ease',
              }}
            >
              <Search size={15} />
              <span>Tìm Kiếm</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('PERSPECTIVE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '9px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: mode === 'PERSPECTIVE' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                background: mode === 'PERSPECTIVE' ? 'rgba(14, 165, 233, 0.22)' : 'transparent',
                color: mode === 'PERSPECTIVE' ? '#38bdf8' : '#94a3b8',
                transition: 'all 0.18s ease',
              }}
            >
              <Navigation size={15} />
              <span>Đổi Góc Nhìn</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="picker-search-container">
            <Search size={18} color={mode === 'SEARCH' ? '#34d399' : '#38bdf8'} style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={mode === 'SEARCH' ? 'Tìm theo tên, biệt danh, thế hệ...' : 'Chọn người thân làm tâm điểm...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
              className="picker-search-input"
              aria-label="Tìm kiếm người thân trong dòng họ"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="picker-clear-btn"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs (Smooth Horizontal Scroll, Clean Labels) */}
          <div className="picker-tabs-scroll" role="tablist" aria-label="Bộ lọc nhánh và thế hệ">
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'ALL'}
              className={`picker-tab-chip ${filterType === 'ALL' ? 'active' : 'inactive'}`}
              onClick={() => {
                setFilterType('ALL');
                setSelectedIndex(0);
              }}
            >
              <span>Tất cả ({tree.members.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'PATERNAL'}
              className={`picker-tab-chip ${filterType === 'PATERNAL' ? 'active' : 'inactive'}`}
              onClick={() => {
                setFilterType('PATERNAL');
                setSelectedIndex(0);
              }}
            >
              <span>Bên Nội</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'MATERNAL'}
              className={`picker-tab-chip ${filterType === 'MATERNAL' ? 'active' : 'inactive'}`}
              onClick={() => {
                setFilterType('MATERNAL');
                setSelectedIndex(0);
              }}
            >
              <span>Bên Ngoại</span>
            </button>

            {generations.map((gen) => (
              <button
                key={gen}
                type="button"
                role="tab"
                aria-selected={filterType === gen}
                className={`picker-tab-chip ${filterType === gen ? 'active' : 'inactive'}`}
                onClick={() => {
                  setFilterType(gen);
                  setSelectedIndex(0);
                }}
              >
                <span>Đời {gen}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Recent Picks Strip (Clean horizontal tags) */}
        {!searchTerm && recentMembers.length > 0 && filterType === 'ALL' && (
          <div className="picker-recents-strip">
            <div className="picker-recents-label">
              <History size={13} color="#94a3b8" />
              <span>Gần đây:</span>
            </div>
            {recentMembers.map((m) => (
              <button
                key={`recent-${m.id}`}
                type="button"
                onClick={() => handleSelect(m)}
                className="picker-recent-pill"
                title={`Chọn ${m.fullName}`}
              >
                <span>{m.fullName}</span>
                {mePerson?.id === m.id && <Check size={12} color="#34d399" />}
              </button>
            ))}
          </div>
        )}

        {/* 3. Results List */}
        <div
          ref={listContainerRef}
          className="picker-results-list"
          role="listbox"
          aria-label="Danh sách thành viên"
        >
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#cbd5e1' }}>
                Không tìm thấy người thân phù hợp.
              </p>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Thử tìm theo tên không dấu hoặc chuyển sang bộ lọc "Tất cả".
              </p>
            </div>
          ) : (
            filteredMembers.map((person, idx) => {
              const isSelected = idx === selectedIndex;
              const isCurrentMe = mePerson?.id === person.id;
              const kinshipTitle = getKinshipToMe(mePerson, person, tree.members, tree.relationships);

              return (
                <div
                  key={person.id}
                  data-selected={isSelected}
                  onClick={() => handleSelect(person)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                  className={`picker-item-card ${isCurrentMe ? 'is-current' : ''}`}
                >
                  <div className="picker-item-left">
                    {/* Avatar (Image or Initials) */}
                    <div className={`picker-avatar ${isCurrentMe ? 'is-current' : ''}`}>
                      {person.avatarUrl ? (
                        <img
                          src={person.avatarUrl}
                          alt={person.fullName}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{getInitials(person.fullName)}</span>
                      )}
                    </div>

                    <div className="picker-info-col">
                      <div className="picker-name-row">
                        <span
                          className="picker-person-name"
                          title={person.fullName}
                          style={{
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {person.fullName}
                        </span>
                        {person.nickname && (
                          <span className="picker-person-nickname" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                            ({person.nickname})
                          </span>
                        )}
                        {mode === 'PERSPECTIVE' && isCurrentMe && (
                          <span className="picker-viewing-badge">
                            Đang xem
                          </span>
                        )}
                      </div>

                      {/* Clean Badges Row - Never breaks across words */}
                      <div className="picker-badges-row">
                        <span className="picker-badge-kinship">
                          {kinshipTitle}
                        </span>
                        <span className="picker-badge-gen">
                          Đời {person.generation}
                        </span>
                        <span className={`picker-badge-status ${person.isDeceased ? 'deceased' : 'living'}`}>
                          {person.isDeceased ? '✟ Đã khuất' : '✦ Còn sống'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Selection / Mode Action Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: '0.4rem' }}>
                    {mode === 'SEARCH' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>
                        <span className="hidden sm:inline">Hồ sơ</span>
                        <ArrowRight size={17} />
                      </div>
                    ) : isCurrentMe ? (
                      <Check size={19} color="#34d399" />
                    ) : (
                      <Navigation size={16} color="#38bdf8" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer with responsive behavior */}
        <div className="picker-footer-bar">
          {/* Desktop Keyboard Hints (Hidden on Mobile) */}
          <div className="picker-desktop-hints">
            <span>
              {mode === 'SEARCH'
                ? 'Nhấn vào thành viên để xem hồ sơ chi tiết'
                : 'Dùng phím ↑ ↓ để duyệt, Enter để chọn góc nhìn'}
            </span>
          </div>

          {onResetToMe && mode === 'PERSPECTIVE' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onResetToMe();
                onClose();
              }}
              style={{
                fontSize: '0.84rem',
                padding: '0.45rem 0.95rem',
                gap: '0.45rem',
                borderRadius: '999px',
                borderColor: 'rgba(52, 211, 153, 0.4)',
                color: '#34d399',
              }}
            >
              <Navigation size={14} color="#34d399" />
              <span>Về vị trí của tôi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
