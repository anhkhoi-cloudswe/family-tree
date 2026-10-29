import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  Calendar,
  Bell,
  Navigation,
  ExternalLink,
  ChevronRight,
  MapPin,
  Copy,
  Settings,
  X,
} from 'lucide-react';
import { Person, FamilyTree } from '../types';
import { calculateAnniversaryStatus, AnniversaryStatus } from '../utils/lunarHelper';
import { getInitials } from '../utils/formatHelper';
import { useToast } from './Toast';

interface LunarAnniversaryViewProps {
  tree: FamilyTree;
  onSelectPerson: (person: Person) => void;
  onOpenReminderSettings?: () => void;
}

interface AncestorWithAnniversary {
  person: Person;
  anniversary: AnniversaryStatus;
}

export const LunarAnniversaryView: React.FC<LunarAnniversaryViewProps> = ({
  tree,
  onSelectPerson,
  onOpenReminderSettings,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UPCOMING'>('ALL');

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
    const query = searchTerm.toLowerCase().trim();
    return sortedItems.filter(({ person, anniversary }) => {
      if (filterType === 'UPCOMING') {
        if (!anniversary.hasValidDate || anniversary.daysLeft < 0 || anniversary.daysLeft > 45) {
          return false;
        }
      }

      if (!query) return true;

      const matchName = person.fullName.toLowerCase().includes(query);
      const matchNick = person.nickname?.toLowerCase().includes(query);
      const matchLunar = person.lunarDeathDay?.toLowerCase().includes(query);
      const matchBurial = person.burialPlace?.toLowerCase().includes(query);
      const matchSolar = anniversary.solarDateStr?.includes(query);

      return matchName || matchNick || matchLunar || matchBurial || matchSolar;
    });
  }, [sortedItems, searchTerm, filterType]);

  const upcomingCount = useMemo(() => {
    return sortedItems.filter(
      ({ anniversary }) => anniversary.hasValidDate && anniversary.daysLeft >= 0 && anniversary.daysLeft <= 45
    ).length;
  }, [sortedItems]);

  const formatLunarDay = (lunarStr?: string) => {
    if (!lunarStr) return 'Chưa cập nhật ngày giỗ';
    return lunarStr.replace(/\s*Âm\s*lịch/i, '').trim() + ' (Âm lịch)';
  };

  const getMapsUrl = (coords?: string, address?: string) => {
    if (coords && coords.includes(',')) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords.trim())}`;
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    }
    return '';
  };

  const handleShareZalo = () => {
    if (deceasedMembers.length === 0) {
      toast.info('Chưa có thông tin ngày giỗ để sao chép.');
      return;
    }

    const lines: string[] = [
      `📜 LỊCH GIỖ GIA TỘC - CÂY GIA PHẢ: ${tree.name.toUpperCase()}`,
      `Năm xem lịch: ${new Date().getFullYear()}`,
      '----------------------------------------',
    ];

    sortedItems.forEach(({ person, anniversary }, idx) => {
      const lunar = person.lunarDeathDay ? formatLunarDay(person.lunarDeathDay) : 'Chưa rõ';
      const solar = anniversary.hasValidDate ? `-> Dương lịch năm nay: ${anniversary.solarDateStr}` : '';
      const burial = person.burialPlace ? ` (Mộ: ${person.burialPlace})` : '';
      lines.push(`${idx + 1}. ${person.fullName} (Đời ${person.generation}): ${lunar} ${solar}${burial}`);
    });

    lines.push('----------------------------------------');
    lines.push('Tra cứu chi tiết phả hệ & nhắc nhở tại: famlykin.io.vn');

    const fullText = lines.join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        toast.success('Đã sao chép danh sách lịch giỗ! Bạn có thể dán vào Zalo/Tin nhắn gia đình.');
      }).catch(() => {
        toast.error('Không thể tự động sao chép. Vui lòng thử lại.');
      });
    } else {
      toast.info('Trình duyệt không hỗ trợ tự động sao chép.');
    }
  };

  return (
    <div className="member-list-view-root">
      {/* 1. Sticky Search & Filter Toolbar */}
      <div className="list-sticky-toolbar">
        {/* Search Input Box */}
        <div className="list-search-wrapper">
          <Search size={18} className="list-search-icon" />
          <input
            type="text"
            className="list-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tổ tiên, ngày giỗ, nơi an táng..."
            aria-label="Tìm kiếm trong lịch giỗ gia tộc"
          />
          {searchTerm && (
            <button
              type="button"
              className="list-clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills & Quick Actions Row */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'ALL'}
              className={`px-3 py-1 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
              onClick={() => setFilterType('ALL')}
            >
              Tất cả ({items.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filterType === 'UPCOMING'}
              className={`px-3 py-1 rounded-full text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'UPCOMING'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
              onClick={() => setFilterType('UPCOMING')}
            >
              <Bell size={12} className={upcomingCount > 0 ? 'text-rose-400' : 'text-slate-400'} />
              <span>Sắp tới 45 ngày ({upcomingCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareZalo}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              title="Sao chép toàn bộ lịch giỗ để gửi qua Zalo gia đình"
            >
              <Copy size={13} className="text-emerald-400" />
              <span>Gửi Zalo</span>
            </button>

            {onOpenReminderSettings && (
              <button
                type="button"
                onClick={onOpenReminderSettings}
                className="p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Cài đặt thông báo & nhắc nhở"
                aria-label="Cài đặt nhắc nhở"
              >
                <Settings size={15} className="text-emerald-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Scrollable List - Clean iOS Hairline Style */}
      <div className="list-content-container" style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '0.5rem 1rem 3rem 1rem' }}>
        {filtered.length === 0 ? (
          <div className="list-empty-state">
            <Flame size={44} className="list-empty-icon text-slate-500" />
            <h3 className="list-empty-title">Không tìm thấy người thân</h3>
            <p className="list-empty-desc">
              {deceasedMembers.length === 0
                ? 'Gia phả hiện chưa có thông tin người thân đã khuất.'
                : 'Không có thông tin ngày giỗ nào khớp với từ khóa tìm kiếm.'}
            </p>
            {filterType === 'UPCOMING' && deceasedMembers.length > 0 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setFilterType('ALL')}
              >
                Xem toàn bộ lịch giỗ
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(({ person, anniversary }, idx) => {
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
                    padding: '0.9rem 0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
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
                        width: '46px',
                        height: '46px',
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
                            fontSize: '0.98rem',
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
                            padding: '0.12rem 0.45rem',
                            background: 'rgba(255, 255, 255, 0.07)',
                            color: '#cbd5e1',
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
                          gap: '0.45rem',
                          flexWrap: 'wrap',
                          marginTop: '0.35rem',
                        }}
                      >
                        {/* Lunar Date */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: person.lunarDeathDay ? '#fda4af' : '#64748b',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Flame size={12} color={person.lunarDeathDay ? '#f43f5e' : '#64748b'} />
                          <span>{formatLunarDay(person.lunarDeathDay || undefined)}</span>
                        </div>

                        {/* Calculated Solar Date */}
                        {anniversary.hasValidDate && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#38bdf8',
                              fontSize: '0.76rem',
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Calendar size={11} color="#38bdf8" />
                            <span>Dương lịch: <strong style={{ color: '#ffffff' }}>{anniversary.solarDateStr}</strong></span>
                          </div>
                        )}

                        {/* Status Countdown Badge */}
                        {anniversary.hasValidDate && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.5rem',
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
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badge.text}
                          </span>
                        )}
                      </div>

                      {/* Burial Place & Google Maps Link (If recorded) */}
                      {person.burialPlace && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            marginTop: '0.3rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <MapPin size={12} color="#ea580c" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Mộ phần: {person.burialPlace}
                          </span>
                          {person.burialCoordinates && (
                            <a
                              href={getMapsUrl(person.burialCoordinates, person.burialPlace)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};
