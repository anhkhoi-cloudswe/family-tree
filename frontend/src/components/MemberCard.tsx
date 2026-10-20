import React, { useState } from 'react';
import { Person } from '../types';
import { Calendar, MapPin, Sparkles, User, Heart } from 'lucide-react';
import { formatDateVN } from '../utils/dateHelper';
import { getInitials } from '../utils/formatHelper';

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

    if (bDate && dDate) {
      return `${bDate} - ${dDate}`;
    }
    if (bDate) {
      return `Sinh: ${bDate}`;
    }
    if (person.isDeceased && person.lunarDeathDay) {
      return `Giỗ: ${person.lunarDeathDay}`;
    }
    if (dDate) {
      return `Mất: ${dDate}`;
    }
    return null;
  };

  const birthDeathText = getBirthDeathSummary();


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
      {/* Badge if Me */}
      {isMe && (
        <div className="me-badge" title="Đây là vị trí của bạn (Tôi) trên cây gia phả">
          <Sparkles size={11} />
          <span>Tôi</span>
        </div>
      )}

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

      {/* 2. Họ và tên */}
      <div className="card-name" title={person.fullName}>
        {person.fullName}
      </div>

      {/* 3. Vai vế với mình */}
      <div className={`kinship-pill ${getPillClass()}`}>
        {kinshipTitle}
      </div>

      {/* 4. Detailed Mode Information (When isCompact is false) */}
      {!isCompact && (
        <div className="card-extra-info">
          {birthDeathText && (
            <div className="card-meta-row">
              <Calendar size={12} className="meta-icon" />
              <span>{birthDeathText}</span>
            </div>
          )}
          {person.nickname && (
            <div className="card-meta-nickname" title={`Biệt danh: ${person.nickname}`}>
              &ldquo;{person.nickname}&rdquo;
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
