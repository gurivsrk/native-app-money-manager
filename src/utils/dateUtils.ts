import dayjs from 'dayjs';

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns today's date in 'YYYY-MM-DD' format
 */
export const getTodayDateString = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

/**
 * Returns current year-month in 'YYYY-MM' format
 */
export const getCurrentYearMonthString = (): string => {
  return dayjs().format('YYYY-MM');
};

/**
 * Parses a date string safely into a Dayjs instance
 */
export const toDayjs = (dateStr?: string | Date): dayjs.Dayjs => {
  return dateStr ? dayjs(dateStr) : dayjs();
};

/**
 * Formats a date string into "Mon, 05 Oct 2026"
 */
export const formatDateWithWeekday = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('ddd, DD MMM YYYY') : dateStr;
};

/**
 * Formats a date string into "Monday, 5 October 2026"
 */
export const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('dddd, D MMMM YYYY') : dateStr;
};

/**
 * Returns the full weekday name (e.g. "Monday") for a given date string
 */
export const getWeekdayForDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('dddd') : '';
};

/**
 * Returns "October 2026" from a 'YYYY-MM' string
 */
export const formatYearMonth = (yearMonthStr: string): string => {
  if (!yearMonthStr) return '';
  const d = dayjs(`${yearMonthStr}-01`);
  return d.isValid() ? d.format('MMMM YYYY') : yearMonthStr;
};

/**
 * Returns total days in the given month (1-indexed month)
 */
export const getDaysInMonth = (year: number, month: number): number => {
  const mm = String(month).padStart(2, '0');
  return dayjs(`${year}-${mm}-01`).daysInMonth();
};

/**
 * Returns the weekday index (0 for Sun, 1 for Mon, ..., 6 for Sat) of the 1st of the month
 */
export const getFirstDayWeekday = (year: number, month: number): number => {
  const mm = String(month).padStart(2, '0');
  return dayjs(`${year}-${mm}-01`).day();
};

export default dayjs;
