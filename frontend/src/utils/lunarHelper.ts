/**
 * Thuật toán tính Âm Dương Lịch Việt Nam (Múi giờ UTC+7)
 * Dựa trên bảng tra cứu thiên văn chuẩn của TS. Hồ Ngọc Đức (1900 - 2199).
 */

const TK20 = [
  0x3c4bd8, 0x624ae0, 0x4ca570, 0x3854d5, 0x5cd260, 0x44d950, 0x315554, 0x5656a0, 0x409ad0, 0x2a55d2,
  0x504ae0, 0x3aa5b6, 0x60a4d0, 0x48d250, 0x33d255, 0x58b540, 0x42d6a0, 0x2cada2, 0x5295b0, 0x3f4977,
  0x644970, 0x4ca4b0, 0x36b4b5, 0x5c6a50, 0x466d50, 0x312b54, 0x562b60, 0x409570, 0x2c52f2, 0x504970,
  0x3a6566, 0x5ed4a0, 0x48ea50, 0x336a95, 0x585ad0, 0x442b60, 0x2f86e3, 0x5292e0, 0x3dc8d7, 0x62c950,
  0x4cd4a0, 0x35d8a6, 0x5ab550, 0x4656a0, 0x31a5b4, 0x5625d0, 0x4092d0, 0x2ad2b2, 0x50a950, 0x38b557,
  0x5e6ca0, 0x48b550, 0x355355, 0x584da0, 0x42a5b0, 0x2f4573, 0x5452b0, 0x3ca9a8, 0x60e950, 0x4c6aa0,
  0x36aea6, 0x5aab50, 0x464b60, 0x30aae4, 0x56a570, 0x405260, 0x28f263, 0x4ed940, 0x38db47, 0x5cd6a0,
  0x4896d0, 0x344dd5, 0x5a4ad0, 0x42a4d0, 0x2cd4b4, 0x52b250, 0x3cd558, 0x60b540, 0x4ab5a0, 0x3755a6,
  0x5c95b0, 0x4649b0, 0x30a974, 0x56a4b0, 0x40aa50, 0x29aa52, 0x4e6d20, 0x39ad47, 0x5eab60, 0x489370,
  0x344af5, 0x5a4970, 0x4464b0, 0x2c74a3, 0x50ea50, 0x3d6a58, 0x6256a0, 0x4aaad0, 0x3696d5, 0x5c92e0,
]; // Years 1900-1999

const TK21 = [
  0x46c960, 0x2ed954, 0x54d4a0, 0x3eda50, 0x2a7552, 0x4e56a0, 0x38a7a7, 0x5ea5d0, 0x4a92b0, 0x32aab5,
  0x58a950, 0x42b4a0, 0x2cbaa4, 0x50ad50, 0x3c55d9, 0x624ba0, 0x4ca5b0, 0x375176, 0x5c5270, 0x466930,
  0x307934, 0x546aa0, 0x3ead50, 0x2a5b52, 0x504b60, 0x38a6e6, 0x5ea4e0, 0x48d260, 0x32ea65, 0x56d520,
  0x40daa0, 0x2d56a3, 0x5256d0, 0x3c4afb, 0x6249d0, 0x4ca4d0, 0x37d0b6, 0x5ab250, 0x44b520, 0x2edd25,
  0x54b5a0, 0x3e55d0, 0x2a55b2, 0x5049b0, 0x3aa577, 0x5ea4b0, 0x48aa50, 0x33b255, 0x586d20, 0x40ad60,
  0x2d4b63, 0x525370, 0x3e49e8, 0x60c970, 0x4c54b0, 0x3768a6, 0x5ada50, 0x445aa0, 0x2fa6a4, 0x54aad0,
  0x4052e0, 0x28d2e3, 0x4ec950, 0x38d557, 0x5ed4a0, 0x46d950, 0x325d55, 0x5856a0, 0x42a6d0, 0x2c55d4,
  0x5252b0, 0x3ca9b8, 0x62a930, 0x4ab490, 0x34b6a6, 0x5aad50, 0x4655a0, 0x2eab64, 0x54a570, 0x4052b0,
  0x2ab173, 0x4e6930, 0x386b37, 0x5e6aa0, 0x48ad50, 0x332ad5, 0x582b60, 0x42a570, 0x2e52e4, 0x50d160,
  0x3ae958, 0x60d520, 0x4ada90, 0x355aa6, 0x5a56d0, 0x462ae0, 0x30a9d4, 0x54a2d0, 0x3ed150, 0x28e952,
]; // Years 2000-2099

const TK22 = [
  0x4eb520, 0x38d727, 0x5eada0, 0x4a55b0, 0x362db5, 0x5a45b0, 0x44a2b0, 0x2eb2b4, 0x54a950, 0x3cb559,
  0x626b20, 0x4cad50, 0x385766, 0x5c5370, 0x484570, 0x326574, 0x5852b0, 0x406950, 0x2a7953, 0x505aa0,
  0x3baaa7, 0x5ea6d0, 0x4a4ae0, 0x35a2e5, 0x5aa550, 0x42d2a0, 0x2de2a4, 0x52d550, 0x3e5abb, 0x6256a0,
  0x4c96d0, 0x3949b6, 0x5e4ab0, 0x46a8d0, 0x30d4b5, 0x56b290, 0x40b550, 0x2a6d52, 0x504da0, 0x3b9567,
  0x609570, 0x4a49b0, 0x34a975, 0x5a64b0, 0x446a90, 0x2cba94, 0x526b50, 0x3e2b60, 0x28ab61, 0x4c9570,
  0x384ae6, 0x5cd160, 0x46e4a0, 0x2eed25, 0x54da90, 0x405b50, 0x2c36d3, 0x502ae0, 0x3a93d7, 0x6092d0,
  0x4ac950, 0x32d556, 0x58b4a0, 0x42b690, 0x2e5d94, 0x5255b0, 0x3e25fa, 0x6425b0, 0x4e92b0, 0x36aab6,
  0x5c6950, 0x4674a0, 0x31b2a5, 0x54ad50, 0x4055a0, 0x2aab73, 0x522570, 0x3a5377, 0x6052b0, 0x4a6950,
  0x346d56, 0x585aa0, 0x42ab50, 0x2e56d4, 0x544ae0, 0x3ca570, 0x2864d2, 0x4cd260, 0x36eaa6, 0x5ad550,
  0x465aa0, 0x30ada5, 0x5695d0, 0x404ad0, 0x2aa9b3, 0x50a4d0, 0x3ad2b7, 0x5eb250, 0x48b540, 0x33d556,
]; // Years 2100-2199

// Chuyển ngày/tháng/năm Dương lịch sang số ngày Julian (JDN)
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

// Chuyển số ngày Julian (JDN) sang ngày/tháng/năm Dương lịch
function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number, d: number, e: number, m: number;
  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + alpha - Math.floor(alpha / 4);
  } else {
    a = jd;
  }
  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  if (e < 14) {
    m = e - 1;
  } else {
    m = e - 13;
  }
  let year: number;
  if (m > 2) {
    year = c - 4716;
  } else {
    year = c - 4715;
  }
  return [day, m, year];
}

function getYearInfo(yy: number): number | null {
  if (yy >= 1900 && yy <= 1999) return TK20[yy - 1900];
  if (yy >= 2000 && yy <= 2099) return TK21[yy - 2000];
  if (yy >= 2100 && yy <= 2199) return TK22[yy - 2100];
  return null;
}

interface DecodedMonth {
  month: number;
  leap: number;
  jd: number;
  length: number;
}

function decodeLunarYear(yy: number): DecodedMonth[] | null {
  const k = getYearInfo(yy);
  if (k === null) return null;
  const monthLengths = [29, 30];
  const offsetOfTet = k >> 17;
  const leapMonth = k & 0xf;
  const leapMonthLength = monthLengths[(k >> 16) & 0x1];
  const solarNY = jdFromDate(1, 1, yy);
  let currentJD = solarNY + offsetOfTet;
  let j = k >> 4;
  const regularMonths = new Array(12);
  for (let i = 0; i < 12; i++) {
    regularMonths[11 - i] = monthLengths[j & 0x1];
    j >>= 1;
  }
  const months: DecodedMonth[] = [];
  if (leapMonth === 0) {
    for (let mm = 1; mm <= 12; mm++) {
      months.push({ month: mm, leap: 0, jd: currentJD, length: regularMonths[mm - 1] });
      currentJD += regularMonths[mm - 1];
    }
  } else {
    for (let mm = 1; mm <= leapMonth; mm++) {
      months.push({ month: mm, leap: 0, jd: currentJD, length: regularMonths[mm - 1] });
      currentJD += regularMonths[mm - 1];
    }
    months.push({ month: leapMonth, leap: 1, jd: currentJD, length: leapMonthLength });
    currentJD += leapMonthLength;
    for (let mm = leapMonth + 1; mm <= 12; mm++) {
      months.push({ month: mm, leap: 0, jd: currentJD, length: regularMonths[mm - 1] });
      currentJD += regularMonths[mm - 1];
    }
  }
  return months;
}

/**
 * Chuyển ngày Dương lịch sang Âm lịch chuẩn xác
 * Trả về: { day, month, year, leap }
 */
export function convertSolarToLunar(
  dd: number,
  mm: number,
  yy: number
): { day: number; month: number; year: number; leap: boolean } | null {
  const targetJd = jdFromDate(dd, mm, yy);
  const candidateYears = [yy, yy - 1];
  for (const y of candidateYears) {
    const months = decodeLunarYear(y);
    if (!months) continue;
    for (const m of months) {
      if (targetJd >= m.jd && targetJd < m.jd + m.length) {
        return {
          day: targetJd - m.jd + 1,
          month: m.month,
          year: y,
          leap: m.leap === 1,
        };
      }
    }
  }
  return null;
}

/**
 * Chuyển ngày Âm lịch sang Dương lịch
 */
export function convertLunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean = false
): [number, number, number] {
  const months = decodeLunarYear(lunarYear);
  if (!months) return [lunarDay, lunarMonth, lunarYear];

  const isLeapNum = lunarLeap ? 1 : 0;
  let m = months.find((x) => x.month === lunarMonth && x.leap === isLeapNum);
  if (!m) m = months.find((x) => x.month === lunarMonth);
  if (!m) return [lunarDay, lunarMonth, lunarYear];

  const targetJd = m.jd + lunarDay - 1;
  return jdToDate(targetJd);
}

/**
 * Tự động tính ngày giỗ âm lịch từ ngày mất dương lịch (YYYY-MM-DD hoặc DD/MM/YYYY)
 * Trả về chuỗi: "VD: 11/09 Âm lịch"
 */
export function calculateLunarDeathDayFromSolar(deathDateStr?: string | null): string | null {
  if (!deathDateStr) return null;

  // Hỗ trợ cả định dạng YYYY-MM-DD (HTML input date) và DD/MM/YYYY
  let day: number, month: number, year: number;
  const isoMatch = deathDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else {
    const vnMatch = deathDateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (vnMatch) {
      day = parseInt(vnMatch[1], 10);
      month = parseInt(vnMatch[2], 10);
      year = parseInt(vnMatch[3], 10);
    } else {
      return null;
    }
  }

  const lunar = convertSolarToLunar(day, month, year);
  if (!lunar) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const leapText = lunar.leap ? ' (Nhuận)' : '';
  return `${pad(lunar.day)}/${pad(lunar.month)}${leapText} Âm lịch`;
}

/**
 * Tính ngày Dương lịch của ngày Giỗ trong một năm Dương lịch cụ thể (Mặc định năm nay)
 */
export function getSolarAnniversaryForYear(
  lunarStr?: string | null,
  targetYear: number = new Date().getFullYear()
): { day: number; month: number; year: number; targetSolarYear: number; dateStr: string } | null {
  if (!lunarStr) return null;
  const parsed = parseLunarDate(lunarStr);
  if (!parsed) return null;

  const [d, m, y] = convertLunarToSolar(parsed.day, parsed.month, targetYear);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    day: d,
    month: m,
    year: y,
    targetSolarYear: targetYear,
    dateStr: `${pad(d)}/${pad(m)}/${y}`,
  };
}

/**
 * Trích xuất ngày và tháng âm lịch từ chuỗi văn bản tự do
 * Ví dụ: "15/07 Âm lịch", "15/7", "03/03 Âm lịch (Tết Hàn Thực)", "24/10"
 */
export function parseLunarDate(str?: string | null): { day: number; month: number } | null {
  if (!str) return null;
  const match = str.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }
  return null;
}

export interface CountdownColorStyle {
  background: string;
  color: string;
  border: string;
}

/**
 * Trả về style chuẩn đồng nhất cho ô "Còn lại ... ngày" / "Đã qua ... ngày" trên toàn hệ thống:
 * 1. Hôm nay hoặc Sắp đến gần (dưới 7 ngày hoặc trong tuần này): Màu cam sáng / đỏ cam cảnh báo.
 * 2. Còn thời gian dài (trên 7 ngày hoặc vài tháng tới): Màu xanh dương nhạt (Sky blue / Cyan) hoặc xám bạc trung tính, dịu mắt.
 * 3. Sự kiện đã qua (daysLeft < 0, ví dụ "Đã qua X ngày"): Màu xám tối (muted gray) chìm xuống.
 */
export function getCountdownBadgeStyle(daysLeft: number): CountdownColorStyle {
  if (daysLeft === 0) {
    // Hôm nay: Đỏ tươi nổi bật
    return {
      background: '#e11d48',
      color: '#ffffff',
      border: '1px solid #fda4af',
    };
  }

  if (daysLeft > 0 && daysLeft <= 7) {
    // Sắp đến gần (dưới 7 ngày / trong tuần này): Cam sáng / đỏ cam cảnh báo
    return {
      background: 'rgba(234, 88, 12, 0.22)',
      color: '#fb923c',
      border: '1px solid rgba(249, 115, 22, 0.45)',
    };
  }

  if (daysLeft > 7 && daysLeft <= 30) {
    // Trong tháng tới: Xanh dương nhạt (Cyan / Sky blue) dịu mắt
    return {
      background: 'rgba(14, 165, 233, 0.18)',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.35)',
    };
  }

  if (daysLeft > 30) {
    // Còn dài (vài tháng tới): Xanh dương nhạt / xám bạc trung tính dịu mắt
    return {
      background: 'rgba(56, 189, 248, 0.12)',
      color: '#7dd3fc',
      border: '1px solid rgba(56, 189, 248, 0.25)',
    };
  }

  // daysLeft < 0: Đã qua trong năm -> Màu xám tối chìm xuống
  return {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  };
}

export interface AnniversaryStatus {
  hasValidDate: boolean;
  lunarText: string;
  solarDateStr: string; // VD: 20/10/2026
  daysLeft: number; // 0 = Hôm nay, >0 = sắp đến, <0 = đã qua trong năm
  statusBadge: {
    text: string;
    type: 'today' | 'upcoming' | 'passed' | 'unknown';
  };
}

/**
 * Tính toán trạng thái ngày giỗ cho năm hiện tại
 */
export function calculateAnniversaryStatus(lunarStr?: string | null): AnniversaryStatus {
  if (!lunarStr) {
    return {
      hasValidDate: false,
      lunarText: 'Chưa cập nhật',
      solarDateStr: '',
      daysLeft: 9999,
      statusBadge: { text: 'Chưa có ngày', type: 'unknown' },
    };
  }

  const parsed = parseLunarDate(lunarStr);
  if (!parsed) {
    return {
      hasValidDate: false,
      lunarText: lunarStr,
      solarDateStr: '',
      daysLeft: 9999,
      statusBadge: { text: 'Ngày tự do', type: 'unknown' },
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  // Tính ngày Dương của năm hiện tại
  const [d, m, y] = convertLunarToSolar(parsed.day, parsed.month, currentYear);

  // Tính số ngày chênh lệch với hôm nay (bỏ qua phần giờ phút giây)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const anniversaryStart = new Date(y, m - 1, d);
  const diffTime = anniversaryStart.getTime() - todayStart.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let badgeType: 'today' | 'upcoming' | 'passed' = 'upcoming';
  let badgeText = '';

  if (daysDiff === 0) {
    badgeType = 'today';
    badgeText = 'Hôm nay là Ngày Giỗ!';
  } else if (daysDiff > 0 && daysDiff <= 30) {
    badgeType = 'upcoming';
    badgeText = `Còn ${daysDiff} ngày`;
  } else if (daysDiff > 30) {
    badgeType = 'upcoming';
    badgeText = `Còn ${daysDiff} ngày (${d}/${m})`;
  } else {
    // Đã qua trong năm nay
    badgeType = 'passed';
    badgeText = `Đã qua ${Math.abs(daysDiff)} ngày`;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const solarDateStr = `${pad(d)}/${pad(m)}/${y}`;

  return {
    hasValidDate: true,
    lunarText: `${pad(parsed.day)}/${pad(parsed.month)} Âm lịch`,
    solarDateStr,
    daysLeft: daysDiff,
    statusBadge: {
      text: badgeText,
      type: badgeType,
    },
  };
}
