import React, { useState, useMemo } from 'react';
import { X, Flame, MapPin, ExternalLink, Search, Calendar, Bell, Navigation, Copy, Settings } from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { calculateAnniversaryStatus, AnniversaryStatus } from '../utils/lunarHelper';
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
    if (sortedItems.length === 0) return;
    const header = `🏮 LỊCH GIỖ & MỘ PHẦN TỔ TIÊN - ${tree.name.toUpperCase()}\n---------------------------------------------`;
    const body = sortedItems
      .map((item, idx) => {
        const p = item.person;
        const s = item.anniversary;
        const solar = s.solarDateStr ? ` [Dương lịch: ${s.solarDateStr}]` : '';
        const countdown = s.daysLeft >= 0 && s.daysLeft <= 45 ? ` ⚠️ (Còn ${s.daysLeft} ngày)` : '';
        const burial = p.burialPlace ? `\n   📍 An táng: ${p.burialPlace}` : '';
        return `${idx + 1}. ${p.fullName} (Đời ${p.generation})${countdown}\n   🕯️ Ngày giỗ: ${p.lunarDeathDay || 'Chưa rõ'}${solar}${burial}`;
      })
      .join('\n\n');
    const footer = `\n---------------------------------------------\n📌 Trích xuất từ Cây Gia Phả Số dòng họ`;
    navigator.clipboard.writeText(`${header}\n\n${body}\n${footer}`);
    toast.success('Đã sao chép lịch giỗ vào bộ nhớ tạm! Có thể dán gửi Zalo/tin nhắn ngay.');
  };

  return (
    <div className="minimal-modal-overlay" onClick={onClose}>
      <div
        className="minimal-modal-box"
        style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(225, 29, 72, 0.18), rgba(16, 36, 26, 0.95))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                Lịch Giỗ Âm Lịch & Mộ Phần Tổ Tiên
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>
                Tự động tính ngày Dương lịch năm {new Date().getFullYear()} và nhắc ngày giỗ sắp đến
              </p>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '1.2rem 1.6rem 0.6rem 1.6rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {/* Search Box */}
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
              }}
            >
              <Search size={16} color="#34d399" />
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
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Quick Filter Tabs & Actions */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
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
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  border: filterType === 'UPCOMING' ? '1.5px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: filterType === 'UPCOMING' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterType === 'UPCOMING' ? '#ffffff' : upcomingCount > 0 ? '#fda4af' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <Bell size={13} />
                <span>Sắp tới 45 ngày ({upcomingCount})</span>
              </button>

              <button
                type="button"
                onClick={handleCopySchedule}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#2dd4bf',
                  border: '1px solid rgba(45, 212, 191, 0.3)',
                  background: 'rgba(45, 212, 191, 0.1)',
                  transition: 'all 0.15s ease',
                }}
                title="Sao chép toàn bộ danh sách ngày giỗ để gửi Zalo / tin nhắn cho gia đình"
              >
                <Copy size={13} />
                <span>Sao Chép Gửi Zalo</span>
              </button>

              {onOpenReminderSettings && (
                <button
                  type="button"
                  onClick={onOpenReminderSettings}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#6ee7b7',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    background: 'rgba(52, 211, 153, 0.1)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Cài đặt thời gian nhắc trước ngày sinh nhật & ngày giỗ (Mặc định: trước 1 ngày)"
                >
                  <Settings size={13} />
                  <span>Cài Đặt Nhắc Nhở</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ancestors List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.6rem 1.6rem 1.2rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
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
            filtered.map(({ person, anniversary }) => {
              const badge = anniversary.statusBadge;
              const isToday = badge.type === 'today';
              const isUpcoming = badge.type === 'upcoming';

              return (
                <div
                  key={person.id}
                  style={{
                    background: isToday ? 'rgba(225, 29, 72, 0.22)' : isUpcoming && anniversary.daysLeft <= 15 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 36, 26, 0.8)',
                    border: `1.5px solid ${isToday ? '#f43f5e' : isUpcoming && anniversary.daysLeft <= 15 ? '#f59e0b' : 'rgba(52, 211, 153, 0.25)'}`,
                    borderRadius: '12px',
                    padding: '1rem 1.2rem',
                    boxShadow: isToday ? '0 4px 16px rgba(225, 29, 72, 0.3)' : '0 4px 16px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.9rem', flex: 1 }}>
                    {/* Avatar Initials */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: isToday ? '#e11d48' : 'rgba(255, 255, 255, 0.08)',
                        color: isToday ? '#ffffff' : '#6ee7b7',
                        border: '1.5px solid rgba(52, 211, 153, 0.4)',
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

                    <div style={{ flex: 1 }}>
                      {/* Name & Generation */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                          }}
                        >
                          {person.fullName}
                        </h4>
                        {person.nickname && (
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            ({person.nickname})
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.55rem',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '999px',
                            fontWeight: 600,
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
                          gap: '0.6rem',
                          flexWrap: 'wrap',
                          marginTop: '0.45rem',
                        }}
                      >
                        {/* Lunar Date */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: person.lunarDeathDay ? '#fda4af' : '#64748b',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          <Flame size={14} color={person.lunarDeathDay ? '#f43f5e' : '#64748b'} />
                          <span>{person.lunarDeathDay ? `${person.lunarDeathDay} Âm lịch` : 'Chưa có ngày giỗ'}</span>
                        </div>

                        {/* Calculated Solar Date */}
                        {anniversary.hasValidDate && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#38bdf8',
                              fontSize: '0.82rem',
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '6px',
                              fontWeight: 500,
                            }}
                          >
                            <Calendar size={13} color="#38bdf8" />
                            <span>Dương lịch {new Date().getFullYear()}: <strong style={{ color: '#ffffff' }}>{anniversary.solarDateStr}</strong></span>
                          </div>
                        )}

                        {/* Status Countdown Badge */}
                        {anniversary.hasValidDate && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              background: isToday
                                ? 'rgba(239, 68, 68, 0.25)'
                                : isUpcoming && anniversary.daysLeft <= 15
                                ? 'rgba(245, 158, 11, 0.22)'
                                : isUpcoming
                                ? 'rgba(14, 165, 233, 0.2)'
                                : 'rgba(148, 163, 184, 0.15)',
                              color: isToday
                                ? '#fca5a5'
                                : isUpcoming && anniversary.daysLeft <= 15
                                ? '#fcd34d'
                                : isUpcoming
                                ? '#7dd3fc'
                                : '#cbd5e1',
                              border: `1px solid ${
                                isToday
                                  ? 'rgba(239, 68, 68, 0.45)'
                                  : isUpcoming && anniversary.daysLeft <= 15
                                  ? 'rgba(245, 158, 11, 0.4)'
                                  : isUpcoming
                                  ? 'rgba(14, 165, 233, 0.35)'
                                  : 'rgba(148, 163, 184, 0.25)'
                              }`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {isToday && '🔥 '}
                            {badge.text}
                          </span>
                        )}
                      </div>

                      {/* Burial Place & Map Link */}
                      {person.burialPlace && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginTop: '0.45rem',
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
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                marginLeft: '0.3rem',
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

                  {/* Action button */}
                  <button
                    type="button"
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(52, 211, 153, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
                      e.currentTarget.style.color = '#6ee7b7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onClick={() => {
                      onClose();
                      onSelectPerson(person);
                    }}
                  >
                    Xem Hồ Sơ
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.6rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(6, 20, 13, 0.95)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Tổng số: <strong style={{ color: '#ffffff' }}>{deceasedMembers.length}</strong> đấng sinh thành & tổ tiên tiền bối
          </span>
          <button
            type="button"
            style={{
              padding: '0.5rem 1.4rem',
              fontSize: '0.88rem',
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
