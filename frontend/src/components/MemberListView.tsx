import React, { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  Calendar,
  MapPin,
  User,
  Users,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { FamilyTree, Person } from '../types';
import { getKinshipToMe, getPaternalMaternalMemberIds } from '../utils/kinshipHelper';
import { formatDateVN } from '../utils/dateHelper';
import { getSolarAnniversaryForYear } from '../utils/lunarHelper';
import { getInitials } from '../utils/formatHelper';

interface MemberListViewProps {
  tree: FamilyTree;
  mePerson: Person | null;
  branchFilter: 'ALL' | 'PATERNAL' | 'MATERNAL';
  onBranchFilterChange: (filter: 'ALL' | 'PATERNAL' | 'MATERNAL') => void;
  onSelectPerson: (person: Person) => void;
}

export const MemberListView: React.FC<MemberListViewProps> = ({
  tree,
  mePerson,
  branchFilter,
  onBranchFilterChange,
  onSelectPerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Roman numeral helper
  const toRoman = (num: number) => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || `${num}`;
  };

  // Generation titles for Vietnamese genealogy
  const getGenerationTitle = (gen: number) => {
    return `Đời ${toRoman(gen)}`;
  };

  // Classify members into Paternal (Bên Nội) or Maternal (Bên Ngoại)
  const { paternalMemberIds, maternalMemberIds } = useMemo(() => {
    return getPaternalMaternalMemberIds(mePerson, tree.members, tree.relationships);
  }, [tree.members, tree.relationships, mePerson]);

  // Filter members based on search and branch filter
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tree.members.filter((m) => {
      // 1. Branch filter
      if (branchFilter === 'PATERNAL' && !paternalMemberIds.has(m.id)) return false;
      if (branchFilter === 'MATERNAL' && !maternalMemberIds.has(m.id)) return false;

      // 2. Search query (matches name, nickname, phone, address)
      if (query) {
        const matchName = m.fullName.toLowerCase().includes(query);
        const matchNick = m.nickname?.toLowerCase().includes(query);
        const matchPhone = m.phone?.toLowerCase().includes(query);
        const matchAddress = m.address?.toLowerCase().includes(query);
        const kinship = getKinshipToMe(mePerson, m, tree.members, tree.relationships).toLowerCase();
        const matchKinship = kinship.includes(query);

        if (!matchName && !matchNick && !matchPhone && !matchAddress && !matchKinship) {
          return false;
        }
      }

      return true;
    });
  }, [tree.members, tree.relationships, branchFilter, paternalMemberIds, maternalMemberIds, searchQuery, mePerson]);

  // Group filtered members by generation
  const groupedByGeneration = useMemo(() => {
    const map = new Map<number, Person[]>();

    filteredMembers.forEach((person) => {
      const gen = person.generation || 1;
      if (!map.has(gen)) {
        map.set(gen, []);
      }
      map.get(gen)!.push(person);
    });

    const sortedGens = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedGens.map((gen) => ({
      genNumber: gen,
      members: map.get(gen)!,
    }));
  }, [filteredMembers]);



  const getPillClass = (kinshipTitle: string, isMe: boolean) => {
    if (isMe) return 'pill-me';
    if (
      kinshipTitle.includes('Bố') ||
      kinshipTitle.includes('Mẹ') ||
      kinshipTitle.includes('Ông') ||
      kinshipTitle.includes('Bà') ||
      kinshipTitle.includes('Cụ')
    ) {
      return 'pill-parent';
    }
    if (kinshipTitle.includes('Con') || kinshipTitle.includes('Cháu')) {
      return 'pill-child';
    }
    if (kinshipTitle.includes('Vợ') || kinshipTitle.includes('Chồng')) {
      return 'pill-spouse';
    }
    return 'pill-neutral';
  };

  return (
    <div className="member-list-view-root">
      {/* 1. Sticky Search & Filter Header */}
      <div className="list-sticky-toolbar">
        {/* Search Input Box */}
        <div className="list-search-wrapper">
          <Search size={18} className="list-search-icon" />
          <input
            type="text"
            className="list-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, vai vế, số điện thoại..."
            aria-label="Tìm kiếm thành viên trong danh bạ gia phả"
          />
          {searchQuery && (
            <button
              type="button"
              className="list-clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>


      </div>

      {/* 2. Main Scrollable Directory List */}
      <div className="list-content-container">
        {groupedByGeneration.length === 0 ? (
          <div className="list-empty-state">
            <Users size={48} className="list-empty-icon" />
            <h3 className="list-empty-title">Không tìm thấy thành viên nào</h3>
            <p className="list-empty-desc">
              Không có thành viên nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; trong nhánh đang chọn.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSearchQuery('');
                onBranchFilterChange('ALL');
              }}
            >
              Xem tất cả thành viên
            </button>
          </div>
        ) : (
          groupedByGeneration.map(({ genNumber, members }) => (
            <section
              key={genNumber}
              id={`list-generation-${genNumber}`}
              className="list-generation-section"
            >
              {/* Generation Header Banner */}
              <div className="list-gen-header">
                <div className="list-gen-badge">
                  <span className="gen-roman">{toRoman(genNumber)}</span>
                </div>
                <div className="list-gen-title-box">
                  <h2 className="list-gen-title">{getGenerationTitle(genNumber)}</h2>
                  <span className="list-gen-count">{members.length} người</span>
                </div>
              </div>

              {/* Members Grid / Vertical Directory */}
              <div className="list-cards-grid">
                {members.map((member) => {
                  const isMe = Boolean(mePerson && mePerson.id === member.id);
                  const kinship = getKinshipToMe(mePerson, member, tree.members, tree.relationships);
                  const pillClass = getPillClass(kinship, isMe);
                  const isPaternal = paternalMemberIds.has(member.id);
                  const isMaternal = maternalMemberIds.has(member.id);

                  return (
                    <article
                      key={`${member.id}-${branchFilter}`}
                      className={`list-member-card filter-animate-enter ${isMe ? 'is-me' : ''} ${
                        member.isDeceased ? 'is-deceased' : ''
                      }`}
                      onClick={() => onSelectPerson(member)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${member.fullName}, Vai vế: ${kinship}, Đời ${member.generation}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectPerson(member);
                        }
                      }}
                    >
                      {/* Left: Avatar Column */}
                      <div className="list-avatar-col">
                        <div className="list-avatar-box">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="list-avatar-img"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="list-avatar-initials">
                              {getInitials(member.fullName)}
                            </div>
                          )}

                          {member.isDeceased && (
                            <span
                              className="list-deceased-indicator"
                              title="Đã khuất"
                              aria-label="Đã khuất"
                            >
                              ✟
                            </span>
                          )}
                        </div>

                        {isMe && (
                          <div className="list-me-pill" title="Tài khoản của bạn">
                            <Sparkles size={11} />
                            <span>Tôi</span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Details & Information */}
                      <div className="list-info-col">
                        {/* Name and Kinship Row */}
                        <div className="list-name-row">
                          <h3 className="list-member-name">
                            {member.fullName}
                            {member.nickname && (
                              <span className="list-nickname">({member.nickname})</span>
                            )}
                          </h3>
                        </div>

                        {/* Kinship and Branch Badges */}
                        <div className="list-badges-row">
                          <span className={`list-kinship-chip ${pillClass}`}>
                            {kinship}
                          </span>

                          {isPaternal && !isMaternal && (
                            <span className="list-branch-chip branch-paternal">
                              Bên Nội
                            </span>
                          )}
                          {isMaternal && !isPaternal && (
                            <span className="list-branch-chip branch-maternal">
                              Bên Ngoại
                            </span>
                          )}
                          {isPaternal && isMaternal && (
                            <span className="list-branch-chip branch-direct">
                              Trực Hệ
                            </span>
                          )}
                        </div>

                        {/* Meta Rows: Birth/Death, Lunar Memorial, Address */}
                        <div className="list-meta-rows">
                          {/* Birth & Death Dates (DD/MM/YYYY) */}
                          {(member.birthDate || member.deathDate || member.lunarDeathDay) && (
                            <div className="list-meta-item">
                              <Calendar size={13} className="meta-icon" />
                              <span>
                                {member.birthDate && (
                                  <span>Sinh: {formatDateVN(member.birthDate)}</span>
                                )}
                                {member.isDeceased && (
                                  <>
                                    {member.birthDate && (member.deathDate || member.lunarDeathDay) && ' • '}
                                    {member.deathDate && (
                                      <span>Mất: {formatDateVN(member.deathDate)}</span>
                                    )}
                                    {member.lunarDeathDay && (() => {
                                      const cleanLunar = member.lunarDeathDay.replace(/\s*Âm\s*lịch/i, '').trim();
                                      const anniversary = getSolarAnniversaryForYear(member.lunarDeathDay);
                                      return (
                                        <>
                                          {(member.birthDate || member.deathDate) && ' • '}
                                          {anniversary && (
                                            <>
                                              <span>Giỗ Dương: {anniversary.dateStr}</span>
                                              {' • '}
                                            </>
                                          )}
                                          <strong className="lunar-death-highlight">
                                            Giỗ Âm: {cleanLunar} Âm lịch
                                          </strong>
                                        </>
                                      );
                                    })()}
                                    {!member.lunarDeathDay && member.deathDate && (
                                      <>
                                        {' • '}
                                        <span>Giỗ Dương: {formatDateVN(member.deathDate)}</span>
                                      </>
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Address / Hometown */}
                          {member.address && (
                            <div className="list-meta-item">
                              <MapPin size={13} className="meta-icon" />
                              <span>{member.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Direct One-Touch Phone Call Button for Elderly */}
                        {member.phone && (
                          <div className="list-call-action-wrap">
                            <a
                              href={`tel:${member.phone.replace(/\s+/g, '')}`}
                              className="list-direct-call-btn"
                              onClick={(e) => e.stopPropagation()}
                              title={`Gọi điện ngay cho ${member.fullName}`}
                              aria-label={`Gọi điện cho ${member.fullName}`}
                            >
                              <Phone size={15} />
                              <span>Gọi ngay: {member.phone}</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right: Chevron Arrow */}
                      <div className="list-arrow-col" aria-hidden="true">
                        <ChevronRight size={20} className="list-chevron" />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
