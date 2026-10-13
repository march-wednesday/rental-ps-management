// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - DATE & TIME UTILITIES (WITA / Asia/Makassar)
// ==============================================================================

export const TIMEZONE = 'Asia/Makassar';

/**
 * Get current ISO string adjusted or standard
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date to standard Indonesian date string
 * Example: "13 Oktober 2026"
 */
export function formatIndonesianDate(isoString: string | Date | null | undefined): string {
  if (!isoString) return '-';
  const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format datetime to Indonesian date & time with WITA suffix
 * Example: "13 Okt 2026, 14:30 WITA"
 */
export function formatIndonesianDateTime(isoString: string | Date | null | undefined): string {
  if (!isoString) return '-';
  const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
  if (isNaN(d.getTime())) return '-';

  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${formatted} WITA`;
}

/**
 * Format time only (e.g. "14:30 WITA")
 */
export function formatTimeOnly(isoString: string | Date | null | undefined): string {
  if (!isoString) return '-';
  const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
  if (isNaN(d.getTime())) return '-';

  const timeStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${timeStr} WITA`;
}

export interface RemainingTimeCalculation {
  isExpired: boolean;
  isWarning10Min: boolean;
  isWarning5Min: boolean;
  totalSeconds: number; // positive if remaining, negative if overdue
  hours: number;
  minutes: number;
  seconds: number;
  formattedText: string;
}

/**
 * Calculate remaining time from target end time ISO string against current time.
 * Handles sessions crossing midnight seamlessly via Unix timestamps!
 */
export function calculateRemainingTime(targetEndTimeIso: string): RemainingTimeCalculation {
  const targetTime = new Date(targetEndTimeIso).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;
  const totalSeconds = Math.round(diffMs / 1000);

  const isExpired = totalSeconds <= 0;
  const absSeconds = Math.abs(totalSeconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = hours > 0 
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
    : `${pad(minutes)}:${pad(seconds)}`;

  const formattedText = isExpired 
    ? `Lewat ${timeFormatted}` 
    : `${timeFormatted}`;

  const isWarning10Min = !isExpired && totalSeconds <= 600 && totalSeconds > 300;
  const isWarning5Min = !isExpired && totalSeconds <= 300 && totalSeconds > 0;

  return {
    isExpired,
    isWarning10Min,
    isWarning5Min,
    totalSeconds,
    hours,
    minutes,
    seconds,
    formattedText,
  };
}

/**
 * Robust parser for Excel time values:
 * Accepts:
 * - Excel fractional day number (e.g. 0.520833 for 12:30)
 * - Strings like "12:30", "12.30", "12;30", "9:5", "09:05"
 * Returns { hour: number, minute: number } or null
 */
export function parseExcelTime(val: any): { hour: number; minute: number } | null {
  if (val === null || val === undefined || val === '') return null;

  // Numeric decimal from Excel serial date
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    return { hour, minute };
  }

  // String format
  if (typeof val === 'string') {
    const clean = val.trim();
    // match "12:30", "12.30", "12;30", "9:5"
    const match = clean.match(/^(\d{1,2})[:.;](\d{1,2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return { hour, minute };
      }
    }
  }

  return null;
}

/**
 * Robust parser for Excel date values:
 * Accepts:
 * - Excel serial number
 * - String date (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
 */
export function parseExcelDate(val: any): string | null {
  if (!val) return null;

  if (typeof val === 'number') {
    // Excel base date: 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dateMs = excelEpoch.getTime() + val * 86400000;
    const d = new Date(dateMs);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  if (typeof val === 'string') {
    const clean = val.trim();
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const d = new Date(clean);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  return null;
}
