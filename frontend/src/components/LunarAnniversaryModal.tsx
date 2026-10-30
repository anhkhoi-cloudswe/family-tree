import React, { useState, useMemo } from 'react';
import { X, Flame, MapPin, ExternalLink, Search, Calendar, Bell, Navigation, Copy, Settings, ChevronRight } from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { calculateAnniversaryStatus, AnniversaryStatus, getCountdownBadgeStyle } from '../utils/lunarHelper';
import { getInitials } from '../utils/formatHelper';
import { useToast } from './Toast';

interface LunarAnniversaryModalProps {
  tree: FamilyTree;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onOpenReminderSettings?: () => void;
}

interface AncestorWithAnniversary {
  person: Person;
  anniversary: AnniversaryStatus;
}

export const LunarAnniversaryModal: React.FC<LunarAnniversaryModalProps> = ({
  tree,
  onClose,
  onSelectPerson,
  onOpenReminderSettings,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UPCOMING' | 'THIS_YEAR'>('ALL');

  const deceasedMembers = useMemo(() => {
    return tree.members.filter((m) => m.isDeceased);
  }, [tree.members]);

  const items: AncestorWithAnniversary[] = useMemo(() => {
    return deceasedMembers.map((person) => ({
      person,
      anniversary: calculateAnniversaryStatus(person.lunarDeathDay),
    }));
  }, [deceasedMembers]);

  // Sắp xếp: Ai sắp đến ngày giỗ (daysLeft >= 0) xếp lên đầu theo thứ tự ngày tăng dần
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aLeft = a.anniversary.daysLeft;
      const bLeft = b.anniversary.daysLeft;

      const aIsUpcoming = aLeft >= 0 && aLeft <= 365;
      const bIsUpcoming = bLeft >= 0 && bLeft <= 365;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      if (aIsUpcoming && bIsUpcoming) return aLeft - bLeft;

      return a.person.generation - b.person.generation;
    });
  }, [items]);

  const filtered = useMemo(() => {
    return sortedItems.filter(({ person, anniversary }) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        person.fullName.toLowerCase().includes(query) ||
        (person.nickname && person.nickname.toLowerCase().includes(query)) ||
        (person.lunarDeathDay && person.lunarDeathDay.toLowerCase().includes(query)) ||
        (person.burialPlace && person.burialPlace.toLowerCase().includes(query));

      if (!matchSearch) return false;

      if (filterType === 'UPCOMING') {
        return anniversary.daysLeft >= 0 && anniversary.daysLeft <= 45;
      }

      return true;
    });
  }, [sortedItems, searchTerm, filterType]);

  const upcomingCount = useMemo(() => {
    return items.filter((i) => i.anniversary.daysLeft >= 0 && i.anniversary.daysLeft <= 45).length;
  }, [items]);

  const handleCopySchedule = () => {
    // Chỉ lấy những người đã có thông tin ngày giỗ
    const validItems = sortedItems.filter(
      (item) => item.person.lunarDeathDay && item.person.lunarDeathDay.trim()
    );

    if (validItems.length === 0) {
      toast.info('Chưa có thông tin ngày giỗ nào được cập nhật để sao chép.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const header = `🏮 LỊCH GIỖ trong năm ${currentYear}\n---------------------------------------------`;
    const body = validItems
      .map((item, idx) => {
        const p = item.person;
        const s = item.anniversary;
        const solar = s.solarDateStr ? ` [Dương lịch: ${s.solarDateStr}]` : '';
        return `${idx + 1}. ${p.fullName}\nNgày giỗ: ${p.lunarDeathDay} Âm lịch${solar}`;
      })
      .join('\n\n');
    const footer = `\n---------------------------------------------`;

    navigator.clipboard.writeText(`${header}\n\n${body}${footer}`);
    toast.success('Đã sao chép lịch giỗ vào bộ nhớ tạm!');
  };

  const formatLunarDay = (lunarDay?: string | null) => {
    if (!lunarDay || !lunarDay.trim()) return 'Chưa có ngày giỗ';
    const clean = lunarDay.replace(/\s*âm\s*lịch/gi, '').trim();
    return `${clean} Âm lịch`;
  };

  return (
    <div
      className="minimal-modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1200,
        padding: 'max(0.75rem, env(safe-area-inset-top)) 0.75rem max(0.75rem, env(safe-area-inset-bottom)) 0.75rem',
      }}
    >
      <div
        className="minimal-modal-box"
        style={{
          maxWidth: '720px',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(9, 24, 17, 0.98)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(225, 29, 72, 0.18), rgba(16, 36, 26, 0.95))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
                flexShrink: 0,
              }}
            >
              <Flame size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Lịch Giỗ Âm Lịch & Dương Lịch
              </h3>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng" style={{ flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '0.85rem 1.1rem 0.4rem 1.1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.5rem' }}>
            {/* Search Box */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '0.45rem 0.75rem',
              }}
            >
              <Search size={15} color="#34d399" />
              <input
                type="text"
                placeholder="Tìm tổ tiên, ngày giỗ, nơi an táng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Quick Filter Tabs & Actions */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' }}>
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                style={{
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: filterType === 'ALL' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: filterType === 'ALL' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterType === 'ALL' ? '#ffffff' : '#cbd5e1',
                  transition: 'all 0.15s ease',
                }}
              >
                Tất cả ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('UPCOMING')}
                style={{
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                  border: filterType === 'UPCOMING' ? '1.5px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: filterType === 'UPCOMING' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterType === 'UPCOMING' ? '#ffffff' : upcomingCount > 0 ? '#fda4af' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <Bell size={12} />
                <span>Sắp tới 45 ngày ({upcomingCount})</span>
              </button>

              <button
                type="button"
                onClick={handleCopySchedule}
                style={{
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: '#2dd4bf',
                  border: '1px solid rgba(45, 212, 191, 0.3)',
                  background: 'rgba(45, 212, 191, 0.1)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                title="Sao chép danh sách ngày giỗ"
              >
                <Copy size={12} />
                <span>Sao chép</span>
              </button>

              {onOpenReminderSettings && (
                <button
                  type="button"
                  onClick={onOpenReminderSettings}
                  style={{
                    padding: '0.4rem 0.7rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    background: 'rgba(251, 191, 36, 0.1)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="Cài đặt nhắc nhở"
                >
                  <Settings size={12} />
                  <span>Cài đặt</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ancestors List - Clean iOS List Style with Hairline Dividers */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.2rem 1.1rem 1.2rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
              }}
            >
              <Flame size={32} color="#64748b" style={{ margin: '0 auto 0.6rem auto' }} />
              <p style={{ fontWeight: 500, fontSize: '0.95rem', color: '#cbd5e1', margin: 0 }}>
                {deceasedMembers.length === 0
                  ? 'Gia phả hiện chưa có thông tin tổ tiên đã khuất.'
                  : 'Không tìm thấy kết quả phù hợp với bộ lọc.'}
              </p>
              {filterType === 'UPCOMING' && deceasedMembers.length > 0 && (
                <button
                  type="button"
                  style={{
                    marginTop: '0.8rem',
                    fontSize: '0.82rem',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    background: 'rgba(52, 211, 153, 0.1)',
                    color: '#6ee7b7',
                    cursor: 'pointer',
                  }}
                  onClick={() => setFilterType('ALL')}
                >
                  Xem toàn bộ danh sách giỗ
                </button>
              )}
            </div>
          ) : (
            filtered.map(({ person, anniversary }, idx) => {
              const badge = anniversary.statusBadge;
              const isToday = badge.type === 'today';
              const isUpcoming = badge.type === 'upcoming';
              const isLast = idx === filtered.length - 1;

              return (
                <div
                  key={person.id}
                  onClick={() => onSelectPerson(person)}
                  style={{
                    background: isToday ? 'rgba(225, 29, 72, 0.12)' : 'transparent',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: isToday ? '8px' : '0px',
                    padding: '0.8rem 0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isToday
                      ? 'rgba(225, 29, 72, 0.18)'
                      : 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isToday
                      ? 'rgba(225, 29, 72, 0.12)'
                      : 'transparent';
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem hồ sơ của ${person.fullName}`}
                >
                  <div style={{ display: 'flex', gap: '0.85rem', flex: 1, minWidth: 0, alignItems: 'center' }}>
                    {/* Avatar Initials */}
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isToday ? '#e11d48' : 'rgba(255, 255, 255, 0.08)',
                        color: isToday ? '#ffffff' : '#6ee7b7',
                        border: '1.5px solid rgba(52, 211, 153, 0.35)',
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name & Generation */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {person.fullName}
                        </h4>
                        {person.nickname && (
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                            ({person.nickname})
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '999px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Thế hệ {person.generation}
                        </span>
                      </div>

                      {/* Anniversary info with Solar translation and Countdown badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                          marginTop: '0.35rem',
                        }}
                      >
                        {/* Lunar Date - Giỗ Âm hiển thị màu Đỏ */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: person.lunarDeathDay ? '#f87171' : '#64748b',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Flame size={12} color={person.lunarDeathDay ? '#ef4444' : '#64748b'} />
                          <span>{formatLunarDay(person.lunarDeathDay)}</span>
                        </div>

                        {/* Calculated Solar Date - Giỗ Dương lịch hiển thị màu Vàng */}
                        {anniversary.hasValidDate && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#facc15',
                              fontSize: '0.76rem',
                              background: 'rgba(234, 179, 8, 0.12)',
                              border: '1px solid rgba(250, 204, 21, 0.35)',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Calendar size={11} color="#eab308" />
                            <span>Dương lịch: <strong style={{ color: '#fef08a' }}>{anniversary.solarDateStr}</strong></span>
                          </div>
                        )}

                        {/* Status Countdown Badge - Chuẩn màu hệ thống */}
                        {anniversary.hasValidDate && (() => {
                          const badgeStyle = getCountdownBadgeStyle(anniversary.daysLeft);
                          return (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.5rem',
                                borderRadius: '999px',
                                background: badgeStyle.background,
                                color: badgeStyle.color,
                                border: badgeStyle.border,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isToday && '🔥 '}
                              {badge.text}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Burial Place & Map Link */}
                      {person.burialPlace && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginTop: '0.35rem',
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            flexWrap: 'wrap',
                          }}
                        >
                          <MapPin size={13} color="#94a3b8" />
                          <span>Mộ phần: <strong style={{ color: '#e2e8f0' }}>{person.burialPlace}</strong></span>

                          {person.burialCoordinates && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                person.burialCoordinates
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.74rem',
                                marginLeft: '0.3rem',
                                whiteSpace: 'nowrap',
                              }}
                              title={`Xem vị trí tọa độ ${person.burialCoordinates} trên Google Maps`}
                            >
                              <Navigation size={11} />
                              <span>Chỉ đường Maps</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sleek Chevron Arrow indicator */}
                  <div style={{ flexShrink: 0, color: '#64748b', display: 'flex', alignItems: 'center', paddingLeft: '0.35rem' }}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom, 0px)) 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(6, 20, 13, 0.98)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Tổng: <strong style={{ color: '#ffffff' }}>{deceasedMembers.length}</strong>
          </span>
          <button
            type="button"
            style={{
              padding: '0.45rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#e2e8f0',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
