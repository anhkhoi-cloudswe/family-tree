/**
 * Date Formatting and Reminder Helpers (DD/MM/YYYY)
 * Fam3 - Cây Gia Phả Số
 */

/**
 * Format bất kỳ chuỗi ngày tháng hoặc Date object sang định dạng DD/MM/YYYY
 * @param dateStr ISO string (YYYY-MM-DD), Date object, hoặc chuỗi ngày
 * @returns Chuỗi định dạng DD/MM/YYYY hoặc chuỗi rỗng nếu không hợp lệ
 */
export function formatDateVN(dateStr?: string | Date | null): string {
  if (!dateStr) return '';

  if (typeof dateStr === 'string') {
    // 1. Kiểm tra nếu đã là DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${d}/${m}/${y}`;
    }

    // 2. Kiểm tra định dạng ISO YYYY-MM-DD (hoặc YYYY-MM-DDTHH:mm:ss...)
    const ymdMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${d}/${m}/${y}`;
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Lấy năm từ chuỗi ngày (hỗ trợ cả ISO và DD/MM/YYYY)
 */
export function getYearFromDate(dateStr?: string | Date | null): number | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const ymdMatch = dateStr.match(/^(\d{4})/);
    if (ymdMatch) return parseInt(ymdMatch[1], 10);
    const dmyMatch = dateStr.match(/\/(\d{4})/);
    if (dmyMatch) return parseInt(dmyMatch[1], 10);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getFullYear();
}

/**
 * Cấu hình gợi nhớ nhắc ngày kỷ niệm (Sinh nhật & Ngày giỗ)
 */
export interface ReminderSettings {
  enabled: boolean;          // Bật/tắt công tắc nhắc nhở
  advanceDays: number;       // Số ngày nhắc trước (mặc định 1 nếu người dùng quên/chưa cài)
  notifyBirthday: boolean;   // Nhắc ngày sinh nhật
  notifyAnniversary: boolean;// Nhắc ngày giỗ
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  advanceDays: 1, // Mặc định nhắc trước 1 ngày
  notifyBirthday: true,
  notifyAnniversary: true,
};

const REMINDER_STORAGE_KEY = 'fam3_reminder_settings';

export function getStoredReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
        advanceDays: typeof parsed.advanceDays === 'number' && parsed.advanceDays >= 0 ? parsed.advanceDays : 1,
        notifyBirthday: parsed.notifyBirthday !== undefined ? Boolean(parsed.notifyBirthday) : true,
        notifyAnniversary: parsed.notifyAnniversary !== undefined ? Boolean(parsed.notifyAnniversary) : true,
      };
    }
  } catch (e) {
    console.error('Lỗi đọc cấu hình nhắc nhở:', e);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Lỗi lưu cấu hình nhắc nhở:', e);
  }
}

export interface UpcomingEvent {
  personId: string;
  fullName: string;
  generation: number;
  type: 'BIRTHDAY' | 'ANNIVERSARY';
  title: string;
  dateStr: string; // Ngày Dương lịch diễn ra (DD/MM/YYYY)
  daysLeft: number; // 0 = Hôm nay, 1 = Ngày mai,...
  badgeText: string;
}

/**
 * Trích xuất ngày & tháng từ chuỗi ngày (hỗ trợ DD/MM/YYYY và YYYY-MM-DD)
 */
export function parseDayMonth(dateStr?: string | Date | null): { day: number; month: number } | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const dmy = dateStr.match(/^(\d{1,2})\/(\d{1,2})/);
    if (dmy) {
      return { day: parseInt(dmy[1], 10), month: parseInt(dmy[2], 10) };
    }
    const ymd = dateStr.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      return { day: parseInt(ymd[2], 10), month: parseInt(ymd[1], 10) };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { day: d.getDate(), month: d.getMonth() + 1 };
  }
  return null;
}

/**
 * Tính số ngày còn lại đến sự kiện hàng năm (tính theo ngày Dương lịch)
 */
export function calculateDaysLeftAnnual(eventDay: number, eventMonth: number): { daysLeft: number; targetDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let target = new Date(now.getFullYear(), eventMonth - 1, eventDay);
  if (target.getTime() < today.getTime()) {
    // Đã qua trong năm nay, tính đến năm sau
    target = new Date(now.getFullYear() + 1, eventMonth - 1, eventDay);
  }

  const diffTime = target.getTime() - today.getTime();
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return { daysLeft, targetDate: target };
}

