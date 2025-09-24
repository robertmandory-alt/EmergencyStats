// Simple Jalali calendar utilities
// This is a basic implementation - in production, consider using moment-jalaali or similar

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const JALALI_WEEKDAYS = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

export const JALALI_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Simple conversion functions (basic implementation)
export function getCurrentJalaliDate(): JalaliDate {
  const now = new Date();
  const gregorianYear = now.getFullYear();
  const gregorianMonth = now.getMonth() + 1;
  const gregorianDay = now.getDate();
  
  // Basic conversion (approximation for demo - use proper library in production)
  const jalaliYear = gregorianYear - 621;
  const jalaliMonth = gregorianMonth > 3 ? gregorianMonth - 3 : gregorianMonth + 9;
  const jalaliDay = gregorianDay;
  
  return { year: jalaliYear, month: jalaliMonth, day: jalaliDay };
}

export function formatJalaliDate(date: JalaliDate): string {
  return `${date.year}/${date.month.toString().padStart(2, '0')}/${date.day.toString().padStart(2, '0')}`;
}

export function formatJalaliDateLong(date: JalaliDate, includeWeekday = false): string {
  const monthName = JALALI_MONTHS[date.month - 1];
  const dayStr = date.day.toString();
  const yearStr = date.year.toString();
  
  if (includeWeekday) {
    // Simple weekday calculation (approximation)
    const weekdayIndex = (date.day + date.month) % 7;
    const weekday = JALALI_WEEKDAYS[weekdayIndex];
    return `${weekday} ${dayStr} ${monthName} ${yearStr}`;
  }
  
  return `${dayStr} ${monthName} ${yearStr}`;
}

export function getJalaliMonthDays(year: number, month: number): number {
  if (month <= 6) {
    return 31;
  } else if (month <= 11) {
    return 30;
  } else {
    // Simple leap year check (approximation)
    const isLeap = ((year - 979) % 33) % 4 === 1;
    return isLeap ? 30 : 29;
  }
}

export function generateJalaliMonthDays(year: number, month: number): Array<{
  day: number;
  date: string;
  weekday: string;
  isHoliday: boolean;
}> {
  const daysInMonth = getJalaliMonthDays(year, month);
  const days = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const weekdayIndex = (day + month) % 7;
    const weekday = JALALI_WEEKDAYS[weekdayIndex];
    const isHoliday = weekdayIndex === 6; // Friday is holiday
    
    days.push({
      day,
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      weekday,
      isHoliday
    });
  }
  
  return days;
}

export function parseJalaliDate(dateString: string): JalaliDate {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

export function formatPersianNumber(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}
