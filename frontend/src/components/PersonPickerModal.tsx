import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, User, History, Check, Shield, Users, Sparkles, Navigation } from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { getKinshipToMe, getPaternalMaternalMemberIds } from '../utils/kinshipHelper';
import { getInitials } from '../utils/formatHelper';

interface PersonPickerModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  mePerson: Person | null;
  onSelectPerson: (person: Person) => void;
  onClose: () => void;
  onResetToMe?: () => void;
}

const RECENT_KEY = 'familytree_recent_perspective_ids';

export const PersonPickerModal: React.FC<PersonPickerModalProps> = ({
  isOpen,
  tree,
  mePerson,
  onSelectPerson,
  onClose,
  onResetToMe,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PATERNAL' | 'MATERNAL' | number>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

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

    onSelectPerson(person);
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
      className="minimal-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      style={{ zIndex: 10500 }}
    >
      <div
        className="minimal-modal-box"
        style={{
          maxWidth: '580px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div
          style={{
            padding: '1.2rem 1.4rem 0.9rem 1.4rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#166534" />
              <h3 id="picker-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Chọn Người Để Đổi Góc Nhìn Vai Vế
              </h3>
            </div>
            <button className="btn-ghost-sm" onClick={onClose} aria-label="Đóng bảng chọn">
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '0.6rem 0.9rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Search size={18} color="#34d399" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Gõ tên thành viên hoặc biệt danh..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.95rem',
                color: '#ffffff',
                background: 'transparent',
              }}
              aria-label="Tìm kiếm người để đổi vai vế"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              paddingTop: '0.8rem',
              paddingBottom: '0.2rem',
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              className={filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => {
                setFilterType('ALL');
                setSelectedIndex(0);
              }}
            >
              Tất cả ({tree.members.length})
            </button>

            <button
              type="button"
              className={filterType === 'PATERNAL' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => {
                setFilterType('PATERNAL');
                setSelectedIndex(0);
              }}
            >
              🏛️ Bên Nội
            </button>

            <button
              type="button"
              className={filterType === 'MATERNAL' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => {
                setFilterType('MATERNAL');
                setSelectedIndex(0);
              }}
            >
              🌸 Bên Ngoại
            </button>

            {generations.map((gen) => (
              <button
                key={gen}
                type="button"
                className={filterType === gen ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => {
                  setFilterType(gen);
                  setSelectedIndex(0);
                }}
              >
                Đời {gen}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Picks (if no search term) */}
        {!searchTerm && recentMembers.length > 0 && filterType === 'ALL' && (
          <div
            style={{
              padding: '0.75rem 1.4rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
              <History size={14} />
              <span>Gần đây:</span>
            </div>
            {recentMembers.map((m) => (
              <button
                key={`recent-${m.id}`}
                type="button"
                onClick={() => handleSelect(m)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  borderRadius: '999px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{m.fullName}</span>
                {mePerson?.id === m.id && <Check size={12} color="#166534" />}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div
          ref={listContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          role="listbox"
        >
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>
                Không tìm thấy thành viên nào phù hợp.
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(16, 185, 129, 0.22)' : isCurrentMe ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 36, 26, 0.75)',
                    border: `1.5px solid ${isSelected ? '#34d399' : isCurrentMe ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Initials Avatar */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: isCurrentMe ? '#166534' : '#f1f5f9',
                        color: isCurrentMe ? '#ffffff' : '#334155',
                        border: '1.5px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(person.fullName)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                          {person.fullName}
                        </span>
                        {person.nickname && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            ({person.nickname})
                          </span>
                        )}
                        {isCurrentMe && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                            }}
                          >
                            Đang xem
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>
                          Vai vế: {kinshipTitle}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: '#64748b' }}>
                          Thế hệ {person.generation}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: person.isDeceased ? '#64748b' : '#059669', fontWeight: 500 }}>
                          {person.isDeceased ? 'Đã khuất' : 'Còn sống'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCurrentMe && <Check size={18} color="#166534" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with keyboard guidance and "Về vị trí của tôi" */}
        <div
          style={{
            padding: '0.9rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span>Dùng phím <strong>↑</strong> <strong>↓</strong> để chọn, <strong>Enter</strong> để đổi, <strong>Esc</strong> để thoát</span>
          </div>

          {onResetToMe && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onResetToMe();
                onClose();
              }}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', gap: '0.4rem' }}
            >
              <Navigation size={13} color="#166534" />
              <span>Về vị trí của tôi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
