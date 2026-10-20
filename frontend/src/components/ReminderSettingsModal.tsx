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
    <div className="minimal-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="minimal-modal-box"
        style={{
          maxWidth: '560px',
          maxHeight: '92vh',
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
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Gợi Nhớ Sinh Nhật & Ngày Giỗ
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Tùy chỉnh thời gian thông báo trước cho các dịp quan trọng của gia đình
              </p>
            </div>
          </div>
          <button className="btn-ghost-sm" onClick={onClose} title="Đóng">
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* Body content */}
        <div
          style={{
            padding: '1.4rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* 1. Main Toggle Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.1rem',
              background: enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1.5px solid ${enabled ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '12px',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Bật tính năng nhắc nhở tự động</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                {enabled ? 'Hệ thống đang chủ động nhắc bạn các sự kiện sắp tới' : 'Đang tạm dừng mọi thông báo nhắc nhở'}
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
                  padding: '1.1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <Clock size={16} color="#34d399" />
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffffff' }}>
                    Thời gian nhắc trước khi diễn ra:
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.8rem 0' }}>
                  Nếu bạn quên cài đặt, hệ thống luôn mặc định nhắc trước <strong>1 ngày</strong>.
                </p>

                {/* Preset Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  {[
                    { days: 1, label: '1 ngày (Mặc định)' },
                    { days: 2, label: '2 ngày trước' },
                    { days: 3, label: '3 ngày trước' },
                    { days: 7, label: '1 tuần (7 ngày)' },
                  ].map((p) => {
                    const isSelected = advanceDays === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => handleSelectPreset(p.days)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 600 : 500,
                          background: isSelected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1.5px solid ${isSelected ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}`,
                          color: isSelected ? '#34d399' : '#cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom days input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>Hoặc nhập số ngày cụ thể:</span>
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
                      width: '80px',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1.5px solid rgba(52, 211, 153, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>ngày trước</span>
                </div>
              </div>

              {/* 3. Event Types Checkboxes */}
              <div
                style={{
                  padding: '1.1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
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
                    <span>Ngày Sinh Nhật của các thành viên đang sống</span>
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
                    <span>Ngày Giỗ Âm Lịch của tổ tiên, tiền bối đã khuất</span>
                  </label>
                </div>
              </div>

              {/* 4. Preview list of upcoming events matching configured advance days */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} />
                    Sự kiện khớp lịch nhắc (Trong vòng {advanceDays} ngày tới):
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
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      fontSize: '0.84rem',
                    }}
                  >
                    Không có ngày sinh nhật hay ngày giỗ nào trong vòng {advanceDays} ngày tới.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {upcomingEvents.map((ev, idx) => (
                      <div
                        key={`${ev.personId}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          background: ev.daysLeft === 0 ? 'rgba(225, 29, 72, 0.2)' : 'rgba(52, 211, 153, 0.08)',
                          border: `1px solid ${ev.daysLeft === 0 ? '#f43f5e' : 'rgba(52, 211, 153, 0.25)'}`,
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {ev.type === 'BIRTHDAY' ? <Cake size={16} color="#f472b6" /> : <Flame size={16} color="#fb7185" />}
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                              {ev.title}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
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
                          }}
                        >
                          {ev.badgeText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(6, 20, 13, 0.95)',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.86rem', padding: '0.5rem 1rem' }}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{
              fontSize: '0.86rem',
              padding: '0.5rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
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
