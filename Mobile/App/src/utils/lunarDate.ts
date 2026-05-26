/**
 * Lunar Date Utilities – Chuyển đổi ngày dương ↔ ngày âm (lịch Việt Nam)
 *
 * Dùng thư viện solarlunar đã được test kỹ lưỡng (1900–2100).
 * Nguồn: https://github.com/yize/solarlunar
 */
import solarLunar from 'solarlunar';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
}

// ─── Solar → Lunar ────────────────────────────────────────────────────────────
export function solarToLunar(date: Date): LunarDate {
  const r = solarLunar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return {
    day  : r.lDay,
    month: r.lMonth,
    year : r.lYear,
    isLeap: r.isLeap ?? false,
  };
}

// ─── Lunar → Solar ───────────────────────────────────────────────────────────
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth = false,
): Date | null {
  if (lunarYear < 1900 || lunarYear > 2100) return null;
  if (lunarDay < 1 || lunarDay > 30) return null;
  if (lunarMonth < 1 || lunarMonth > 12) return null;

  const r = solarLunar.lunar2solar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
  if (!r) return null;
  return new Date(r.cYear, r.cMonth - 1, r.cDay);
}

// ─── Formatting ───────────────────────────────────────────────────────────────
const LUNAR_MONTH_NAMES: Record<number, string> = {
  1 : 'Giêng', 2 : 'Hai',  3 : 'Ba',   4 : 'Tư',
  5 : 'Năm',   6 : 'Sáu',  7 : 'Bảy',  8 : 'Tám',
  9 : 'Chín',  10: 'Mười', 11 : 'Một', 12 : 'Hai',
};

const LUNAR_DAY_NAMES: Record<number, string> = {
  1 : 'Mùng 1', 2 : 'Mùng 2', 3 : 'Mùng 3',
  4 : 'Mùng 4', 5 : 'Mùng 5', 6 : 'Mùng 6', 7 : 'Mùng 7',
  8 : 'Mùng 8', 9 : 'Mùng 9', 10: 'Mùng 10',
  11: '11', 12: '12', 13: '13', 14: '14', 15: '15',
  16: '16', 17: '17', 18: '18', 19: '19', 20: '20',
  21: '21', 22: '22', 23: '23', 24: '24', 25: '25',
  26: '26', 27: '27', 28: '28', 29: '29', 30: '30',
};

export function formatLunarDate(lunar: LunarDate, includeYear = false): string {
  const dayName = LUNAR_DAY_NAMES[lunar.day] ?? String(lunar.day);
  const monthName = LUNAR_MONTH_NAMES[lunar.month] ?? `${lunar.month}`;
  const leapPrefix = lunar.isLeap ? 'Nhuận ' : '';
  const result = `${leapPrefix}${dayName} tháng ${monthName}`;
  return includeYear ? `${result} năm ${lunar.year}` : result;
}

export function formatSolarDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function parseSolarDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

export interface DualDateDisplay {
  solar  : string;
  lunar  : string;
  lunarObj: LunarDate;
}

export function getDualDateDisplay(
  dateStr: string | null | undefined,
): DualDateDisplay | null {
  const parsed = parseSolarDate(dateStr);
  if (!parsed) return null;
  const lunar = solarToLunar(parsed);
  return {
    solar  : formatSolarDate(parsed),
    lunar  : formatLunarDate(lunar, true),
    lunarObj: lunar,
  };
}
