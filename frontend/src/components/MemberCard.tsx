import React, { useState } from 'react';
import { Person } from '../types';
import { Calendar, MapPin, Sparkles, User, Heart } from 'lucide-react';
import { formatDateVN } from '../utils/dateHelper';
import { getInitials } from '../utils/formatHelper';
import { getSolarAnniversaryForYear } from '../utils/lunarHelper';

interface MemberCardProps {
  person: Person;
  kinshipTitle: string;
  isMe: boolean;
  isHighlighted?: boolean;
  isCompact?: boolean;
  onClick: (person: Person) => void;
  onDoubleTap?: (person: Person) => void;
  onMouseEnter?: (person: Person) => void;
  onMouseLeave?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  person,
  kinshipTitle,
  isMe,
  isHighlighted = false,
  isCompact = false,
  onClick,
  onDoubleTap,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const lastTapRef = React.useRef<number>(0);
  const singleClickTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle single-tap vs double-tap
  const handleCardClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLast = now - lastTapRef.current;

    if (timeSinceLast > 0 && timeSinceLast < 320) {
      // Double tap detected!
      if (singleClickTimeoutRef.current) {
        clearTimeout(singleClickTimeoutRef.current);
        singleClickTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      onDoubleTap?.(person);
      return;
    }

    lastTapRef.current = now;
    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
    }
    singleClickTimeoutRef.current = setTimeout(() => {
      onClick(person);
      singleClickTimeoutRef.current = null;
    }, 260);
  };

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
    lastTapRef.current = 0;
    onDoubleTap?.(person);
  };

  // Determine pill style class based on kinship
  const getPillClass = () => {
    if (isMe) return 'me';
    if (
      kinshipTitle.includes('Bố') ||
      kinshipTitle.includes('Mẹ') ||
      kinshipTitle.includes('Ông') ||
      kinshipTitle.includes('Bà') ||
      kinshipTitle.includes('Cụ')
    ) {
      return 'parent';
    }
    if (kinshipTitle.includes('Con') || kinshipTitle.includes('Cháu')) {
      return 'child';
    }
    if (kinshipTitle.includes('Vợ') || kinshipTitle.includes('Chồng')) {
      return 'spouse';
    }
    return '';
  };

  const getBirthDeathSummary = () => {
    const bDate = person.birthDate ? formatDateVN(person.birthDate) : null;
    const dDate = person.deathDate ? formatDateVN(person.deathDate) : null;

    if (person.isDeceased) {
      // Người đã khuất: tự động quy đổi ngày giỗ âm sang ngày giỗ dương của năm hiện tại
      let anniversaryStr: string | null = null;
      if (person.lunarDeathDay) {
        const anniversary = getSolarAnniversaryForYear(person.lunarDeathDay);
        if (anniversary) {
          anniversaryStr = anniversary.dateStr;
        }
      }
      const solarDeath = anniversaryStr || dDate;
      if (solarDeath) {
        return `Giỗ: ${solarDeath} (dương lịch)`;
      }
      if (person.lunarDeathDay) {
        return `Giỗ: ${person.lunarDeathDay.replace(/\s*Âm\s*lịch/i, '').trim()} Âm`;
      }
    }

    if (bDate && dDate) {
      return `${bDate} - ${dDate}`;
    }
    if (bDate) {
      return `Sinh: ${bDate}`;
    }
    if (dDate) {
      return `Giỗ: ${dDate} (dương lịch)`;
    }
    return null;
  };

  const birthDeathText = getBirthDeathSummary();

  // Tính toán độ dài họ tên để tự động co font và ngắt dòng tối ưu không phá vỡ layout
  const fullNameTrim = person.fullName?.trim() || '';
  const nameWords = fullNameTrim ? fullNameTrim.split(/\s+/).length : 0;
  const nameLength = fullNameTrim.length;
  const isNameLong = nameWords >= 4 || nameLength >= 17;
  const isNameVeryLong = nameWords >= 5 || nameLength >= 23;
  const nameClass = isNameVeryLong ? 'name-very-long' : isNameLong ? 'name-long' : '';

  return (
    <div
      data-person-id={person.id}
      className={`minimal-card ${isMe ? 'is-me' : ''} ${person.isDeceased ? 'is-deceased' : ''} ${
        isHighlighted ? 'is-highlighted' : ''
      } ${isCompact ? 'card-compact' : 'card-detailed'}`}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      onMouseEnter={() => {
        setShowTooltip(true);
        onMouseEnter?.(person);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        onMouseLeave?.();
      }}
      role="button"
      tabIndex={0}
      aria-label={`Thành viên: ${person.fullName}, Vai vế: ${kinshipTitle}, Đời thứ ${person.generation}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(person);
        }
      }}
    >
      {/* 1. Avatar */}
      <div className="avatar-container">
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt={person.fullName}
            className="avatar-img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="avatar-initials">{getInitials(person.fullName)}</div>
        )}

        {/* Subtle dot if deceased */}
        {person.isDeceased && (
          <span
            className="deceased-dot"
            title={`Đã khuất${person.lunarDeathDay ? ` • Giỗ: ${person.lunarDeathDay}` : ''}`}
          />
        )}
      </div>

      {/* 2. Họ và tên - Ô cố định chiều cao giúp thẻ đồng nhất, cho phép hiển thị 2 dòng không cắt cụt tên */}
      <div className="card-name-slot">
        <div className={`card-name ${nameClass}`} title={person.fullName}>
          {person.fullName}
        </div>
      </div>

      {/* 3. Vai vế & Biệt danh (Ví dụ: "Tôi / Quắn", "Bố / Ba") */}
      <div className={`kinship-pill ${getPillClass()}`}>
        {kinshipTitle}
        {person.nickname && person.nickname.trim().toLowerCase() !== kinshipTitle.trim().toLowerCase()
          ? ` / ${person.nickname.trim()}`
          : ''}
      </div>

      {/* 4. Detailed Mode Information (When isCompact is false) */}
      {!isCompact && (
        <div className="card-extra-info">
          {birthDeathText && (
            <div className="card-meta-row" title={birthDeathText}>
              <Calendar size={12} className="meta-icon" style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{birthDeathText}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Desktop Hover Tooltip */}
      {showTooltip && (
        <div className="card-desktop-tooltip" role="tooltip">
          <div className="tooltip-header">
            <strong>{person.fullName}</strong>
            <span className="tooltip-gen">Đời {person.generation}</span>
          </div>
          <div className="tooltip-kinship">
            Vai vế: <strong>{kinshipTitle}</strong>
          </div>
          {birthDeathText && (
            <div className="tooltip-sub">
              {person.isDeceased ? '✟ ' : '✦ '}
              {birthDeathText}
            </div>
          )}
          {person.address && (
            <div className="tooltip-address">
              <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
              {person.address}
            </div>
          )}
          <div className="tooltip-hint">Bấm thẻ để xem chi tiết & quan hệ</div>
        </div>
      )}
    </div>
  );
};
