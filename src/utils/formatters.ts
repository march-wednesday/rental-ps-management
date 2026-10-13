// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - FORMATTING UTILITIES
// ==============================================================================

/**
 * Format number to Indonesian Rupiah currency string
 * Example: 10000 -> "Rp 10.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

/**
 * Format number with thousand separators
 * Example: 10000 -> "10.000"
 */
export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(val);
}

/**
 * Clean & parse currency or number from text input (e.g. "Rp 10.000" -> 10000)
 */
export function parseRupiahInput(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format duration minutes to human readable Indonesian string
 * Example: 60 -> "1 Jam", 90 -> "1 Jam 30 Menit", 120 -> "2 Jam"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 Menit';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} Jam ${remainingMinutes} Menit`;
  } else if (hours > 0) {
    return `${hours} Jam`;
  } else {
    return `${remainingMinutes} Menit`;
  }
}
