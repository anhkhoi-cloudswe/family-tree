import React, { useState } from 'react';
import {
  Bell,
  X,
  Cake,
  Flame,
  Check,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Person, FamilyTree } from '../types';
import {
  ReminderSettings,
  saveReminderSettings,
  UpcomingEvent,
  parseDayMonth,
  calculateDaysLeftAnnual,
} from '../utils/dateHelper';
import { calculateAnniversaryStatus } from '../utils/lunarHelper';
import { getInitials } from '../utils/formatHelper';
import { useToast } from './Toast';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onUpdateSettings: (newSettings: ReminderSettings) => void;
  tree: FamilyTree | null;
  onSelectPerson?: (person: Person) => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tree,
  onSelectPerson,
}) => {
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean>(settings.enabled);
  const [advanceDays, setAdvanceDays] = useState<number>(settings.advanceDays);
  const [notifyBirthday, setNotifyBirthday] = useState<boolean>(settings.notifyBirthday);
  const [notifyAnniversary, setNotifyAnniversary] = useState<boolean>(settings.notifyAnniversary);
  const [showConfigSection, setShowConfigSection] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate upcoming events based on tree and current modal advanceDays
  const upcomingEvents: UpcomingEvent[] = [];
  if (tree && enabled) {
    const daysToScan = Math.max(1, advanceDays);

    tree.members.forEach((person) => {
      // 1. Sinh nhật (thành viên còn sống và có birthDate)
      if (notifyBirthday && !person.isDeceased && person.birthDate) {
        const dm = parseDayMonth(person.birthDate);
        if (dm) {
          const { daysLeft, targetDate } = calculateDaysLeftAnnual(dm.day, dm.month);
          if (daysLeft <= daysToScan) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            const dateStr = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}/${targetDate.getFullYear()}`;
            upcomingEvents.push({
              personId: person.id,
              fullName: person.fullName,
              generation: person.generation,
              type: 'BIRTHDAY',
              title: `Sinh nhật ${person.fullName}`,
              dateStr,
              daysLeft,
              badgeText: daysLeft === 0 ? 'Hôm nay!' : daysLeft === 1 ? 'Ngày mai (1 ngày tới)' : `Còn ${daysLeft} ngày`,
            });
          }
        }
      }

      // 2. Ngày giỗ (thành viên đã khuất và có lunarDeathDay hoặc deathDate)
      if (notifyAnniversary && person.isDeceased && person.lunarDeathDay) {
        const status = calculateAnniversaryStatus(person.lunarDeathDay);
        if (status.hasValidDate && status.daysLeft >= 0 && status.daysLeft <= daysToScan) {
          upcomingEvents.push({
            personId: person.id,
            fullName: person.fullName,
            generation: person.generation,
            type: 'ANNIVERSARY',
            title: `Ngày giỗ ${person.fullName} (${person.lunarDeathDay})`,
            dateStr: status.solarDateStr,
            daysLeft: status.daysLeft,
            badgeText: status.daysLeft === 0 ? 'Hôm nay!' : status.daysLeft === 1 ? 'Ngày mai (1 ngày tới)' : `Còn ${status.daysLeft} ngày`,
          });
        }
      }
    });

    // Sort by daysLeft ascending
    upcomingEvents.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  const handleSave = () => {
    const safeDays = Math.max(0, isNaN(advanceDays) ? 1 : advanceDays);
    const newSettings: ReminderSettings = {
      enabled,
      advanceDays: safeDays === 0 ? 1 : safeDays, // Mặc định luôn là 1 nếu người dùng để 0 hoặc bỏ trống
      notifyBirthday,
      notifyAnniversary,
    };
    saveReminderSettings(newSettings);
    onUpdateSettings(newSettings);
    toast.success('Đã lưu cấu hình nhắc nhở thành công!');
    onClose();
  };

  const handleSelectPreset = (days: number) => {
    setAdvanceDays(days);
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
          maxWidth: '560px',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(9, 24, 17, 0.98)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(16,185,129,0.15)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.05))',
            flexShrink: 0,
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <Bell size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Cài Đặt Nhắc Nhở
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sinh nhật và ngày giỗ
              </p>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng" style={{ flexShrink: 0, padding: '0.35rem' }}>
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Body content */}
        <div
          style={{
            padding: '0.85rem 1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* 1. Main Toggle Switch & Quick Settings Button Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.2rem 0 0.75rem 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff', whiteSpace: 'nowrap' }}>
                Bật tính năng nhắc nhở
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {/* Settings Toggle Button: Gọn gàng, dễ bấm, không rớt dòng */}
              <button
                type="button"
                onClick={() => setShowConfigSection(!showConfigSection)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.65rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  background: showConfigSection ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${showConfigSection ? '#34d399' : 'rgba(255, 255, 255, 0.14)'}`,
                  color: showConfigSection ? '#34d399' : '#cbd5e1',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
                title="Tùy chỉnh thời gian nhắc trước và loại sự kiện"
              >
                <Sliders size={13} />
                <span>Cài đặt</span>
                {showConfigSection ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: enabled ? '#34d399' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
                title={enabled ? 'Nhấn để tắt' : 'Nhấn để bật'}
              >
                {enabled ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
              </button>
            </div>
          </div>

          {/* Config Expandable Panel (Tự động bung ra khi người dùng ấn nút "Cài đặt") */}
          {enabled && showConfigSection && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                padding: '0.85rem',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                borderRadius: '14px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* 2. Days in advance setting */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <Clock size={15} color="#34d399" />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>
                    Thời gian nhắc trước:
                  </span>
                </div>

                {/* Preset Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { days: 1, label: '1 ngày (Mặc định)' },
                    { days: 7, label: '1 tuần (7 ngày)' },
                  ].map((p) => {
                    const isSelected = advanceDays === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => handleSelectPreset(p.days)}
                        style={{
                          padding: '0.5rem 0.35rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1.5px solid ${isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                          color: isSelected ? '#34d399' : '#cbd5e1',
                          cursor: 'pointer',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom days input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Nhập ngày cụ thể:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={advanceDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAdvanceDays(isNaN(val) ? 1 : val);
                    }}
                    style={{
                      width: '58px',
                      padding: '0.3rem 0.45rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1.5px solid rgba(52, 211, 153, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      outline: 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ngày trước
                  </span>
                </div>
              </div>

              {/* 3. Event Types Checkboxes */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.55rem' }}>
                  Loại sự kiện cần nhắc:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      color: '#e2e8f0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyBirthday}
                      onChange={(e) => setNotifyBirthday(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
                    />
                    <Cake size={15} color="#f472b6" />
                    <span>Sinh nhật thành viên</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      color: '#e2e8f0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyAnniversary}
                      onChange={(e) => setNotifyAnniversary(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
                    />
                    <Flame size={15} color="#fb7185" />
                    <span>Ngày giỗ âm lịch tổ tiên</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 4. Highlight chính: Danh sách sự kiện khớp lịch nhắc (Thiết kế dạng danh bạ iOS Hairline phẳng) */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Header thông tin khớp lịch nhắc: 2 hàng chuẩn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <Sparkles size={14} />
                Sự kiện khớp lịch nhắc ({advanceDays} ngày tới):
              </span>
              <div style={{ paddingLeft: '1.25rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.55rem',
                    borderRadius: '999px',
                    background: upcomingEvents.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: upcomingEvents.length > 0 ? '#34d399' : '#94a3b8',
                    border: `1px solid ${upcomingEvents.length > 0 ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.12)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {upcomingEvents.length} sự kiện
                </span>
              </div>
            </div>

            {!enabled ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.84rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}
              >
                Tính năng nhắc nhở đang tắt. Hãy bật nút ở trên để theo dõi sinh nhật và ngày giỗ sắp tới.
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.84rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}
              >
                Không có ngày sinh nhật hay ngày giỗ nào trong vòng {advanceDays} ngày tới.
              </div>
            ) : (
              /* Danh bạ sự kiện sắp tới chuẩn Apple Hairline Divider */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {upcomingEvents.map((ev, idx) => {
                  const matchedPerson = tree?.members.find((m) => m.id === ev.personId);
                  const isLast = idx === upcomingEvents.length - 1;
                  const isToday = ev.daysLeft === 0;
                  const isTomorrow = ev.daysLeft === 1;

                  return (
                    <div
                      key={`${ev.personId}-${idx}`}
                      onClick={() => {
                        if (matchedPerson && onSelectPerson) {
                          onSelectPerson(matchedPerson);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.25rem',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: matchedPerson ? 'pointer' : 'default',
                        transition: 'background-color 0.15s ease',
                        gap: '0.65rem',
                      }}
                      role={matchedPerson ? 'button' : undefined}
                      tabIndex={matchedPerson ? 0 : undefined}
                    >
                      {/* Avatar Initials + Thông tin sự kiện */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isToday
                              ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
                              : ev.type === 'BIRTHDAY'
                              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(219, 39, 119, 0.35) 100%)'
                              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
                            border: `1.5px solid ${
                              isToday
                                ? '#fda4af'
                                : ev.type === 'BIRTHDAY'
                                ? 'rgba(244, 114, 182, 0.45)'
                                : 'rgba(251, 191, 36, 0.45)'
                            }`,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(ev.fullName)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          {/* Tên thành viên + Icon loại sự kiện */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {ev.type === 'BIRTHDAY' ? (
                              <Cake size={13} color="#f472b6" style={{ flexShrink: 0 }} />
                            ) : (
                              <Flame size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={ev.fullName}
                            >
                              {ev.fullName}
                            </span>
                            {ev.generation && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.08rem 0.35rem',
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#cbd5e1',
                                  borderRadius: '999px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                Đời {ev.generation}
                              </span>
                            )}
                          </div>

                          {/* Ngày diễn ra */}
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '0.15rem',
                            }}
                          >
                            {ev.type === 'BIRTHDAY' ? 'Sinh nhật' : 'Ngày giỗ'}:{' '}
                            <strong style={{ color: '#e2e8f0' }}>{ev.dateStr}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Countdown Badge Pill */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.18rem 0.55rem',
                          borderRadius: '999px',
                          background: isToday
                            ? 'rgba(225, 29, 72, 0.25)'
                            : isTomorrow
                            ? 'rgba(217, 119, 6, 0.25)'
                            : 'rgba(5, 150, 105, 0.2)',
                          color: isToday
                            ? '#fca5a5'
                            : isTomorrow
                            ? '#fcd34d'
                            : '#6ee7b7',
                          border: `1px solid ${
                            isToday
                              ? 'rgba(239, 68, 68, 0.45)'
                              : isTomorrow
                              ? 'rgba(245, 158, 11, 0.45)'
                              : 'rgba(16, 185, 129, 0.35)'
                          }`,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {ev.badgeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px)) 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem',
            background: 'rgba(6, 20, 13, 0.98)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.45rem 0.5rem',
              borderRadius: '9px',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              height: '38px',
            }}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.45rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              borderRadius: '9px',
              whiteSpace: 'nowrap',
              height: '38px',
            }}
          >
            <Check size={15} />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
