/**
 * Vietnamese Lunar Calendar & Anniversary Helper
 * Hỗ trợ chuyển đổi ngày âm/dương lịch và quản lý ngày giỗ tổ tiên
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
  canChiYear: string;
}

export class LunarService {
  /**
   * Tính Can Chi của năm
   */
  static getCanChiYear(year: number): string {
    const canIndex = (year + 6) % 10;
    const chiIndex = (year + 8) % 12;
    return `${CAN[canIndex]} ${CHI[chiIndex]}`;
  }

  /**
   * Tính ngày giỗ gần nhất và số ngày còn lại (dựa trên chuỗi ngày giỗ lưu trong Person)
   * Ví dụ: "15/07 Âm lịch" hoặc ngày mất Dương lịch
   */
  static parseLunarString(str?: string | null): { day: number; month: number } | null {
    if (!str) return null;
    const match = str.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})/);
    if (match) {
      return {
        day: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
      };
    }
    return null;
  }

  /**
   * Chuẩn hóa hiển thị ngày giỗ
   */
  static formatLunarAnniversary(day: number, month: number): string {
    return `Ngày ${day} tháng ${month} Âm lịch`;
  }
}
