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
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.05))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <Bell size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: 'clamp(0.85rem, 4vw, 0.96rem)', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Nhắc Nhở Sinh Nhật & Ngày Giỗ
              </h3>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng" style={{ flexShrink: 0 }}>
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Body content */}
        <div
          style={{
            padding: '1.1rem 1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* 1. Main Toggle Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.2rem 0.85rem 0.2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                Bật tính năng nhắc nhở tự động
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Thông báo sinh nhật và ngày giỗ sắp diễn ra
              </div>
            </div>

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
                padding: '4px',
              }}
              title={enabled ? 'Nhấn để tắt' : 'Nhấn để bật'}
            >
              {enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
            </button>
          </div>

          {enabled && (
            <>
              {/* 2. Days in advance setting */}
              <div
                style={{
                  padding: '0.4rem 0.2rem 0.85rem 0.2rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <Clock size={16} color="#34d399" />
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>
                    Thời gian nhắc trước:
                  </span>
                </div>

                {/* Preset Pills - Clean 2-column grid side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.9rem' }}>
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
                          padding: '0.55rem 0.4rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1.5px solid ${isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                          color: isSelected ? '#34d399' : '#cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    flexWrap: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
                      width: '64px',
                      padding: '0.35rem 0.5rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1.5px solid rgba(52, 211, 153, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      outline: 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#cbd5e1', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ngày trước
                  </span>
                </div>
              </div>

              {/* 3. Event Types Checkboxes */}
              <div
                style={{
                  padding: '0.4rem 0.2rem 0.85rem 0.2rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.6rem' }}>
                  Loại sự kiện cần nhắc:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyBirthday}
                      onChange={(e) => setNotifyBirthday(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
                    />
                    <Cake size={16} color="#f472b6" />
                    <span>Sinh nhật thành viên</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      color: '#e2e8f0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifyAnniversary}
                      onChange={(e) => setNotifyAnniversary(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#34d399' }}
                    />
                    <Flame size={16} color="#fb7185" />
                    <span>Ngày giỗ âm lịch tổ tiên</span>
                  </label>
                </div>
              </div>

              {/* 4. Preview list of upcoming events matching configured advance days */}
              <div style={{ padding: '0.4rem 0.2rem 0.5rem 0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} />
                    Sự kiện khớp lịch nhắc ({advanceDays} ngày tới):
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {upcomingEvents.length} sự kiện
                  </span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div
                    style={{
                      padding: '1.2rem',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '0.84rem',
                    }}
                  >
                    Không có ngày sinh nhật hay ngày giỗ nào trong vòng {advanceDays} ngày tới.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {upcomingEvents.map((ev, idx) => {
                      const matchedPerson = tree?.members.find((m) => m.id === ev.personId);
                      const isLast = idx === upcomingEvents.length - 1;
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
                          }}
                          role={matchedPerson ? 'button' : undefined}
                          tabIndex={matchedPerson ? 0 : undefined}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {ev.type === 'BIRTHDAY' ? <Cake size={16} color="#f472b6" /> : <Flame size={16} color="#fb7185" />}
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap' }}>
                                {ev.title}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                Dương lịch: {ev.dateStr}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background: ev.daysLeft === 0 ? '#e11d48' : ev.daysLeft === 1 ? '#d97706' : '#059669',
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
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
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px)) 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            background: 'rgba(6, 20, 13, 0.98)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.86rem', padding: '0.65rem 1rem', borderRadius: '10px', justifyContent: 'center' }}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{
              fontSize: '0.86rem',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              borderRadius: '10px',
            }}
          >
            <Check size={16} />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
