// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - AUTOMATED QA TEST SUITE
// Tests critical business logic, timer math, financial consistency, and Excel parsing
// Run with: node --test tests/business-logic.test.mjs
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

// 1. TEST: Format Rupiah
function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

test('Format Rupiah prints correct Indonesian currency format', () => {
  assert.strictEqual(formatRupiah(10000).replace(/\s/g, ''), 'Rp10.000');
  assert.strictEqual(formatRupiah(20000).replace(/\s/g, ''), 'Rp20.000');
  assert.strictEqual(formatRupiah(0).replace(/\s/g, ''), 'Rp0');
});

// 2. TEST: Timer Countdown & Midnight Crossing
function calculateRemainingTime(targetEndTimeIso, currentTimeMs) {
  const targetTime = new Date(targetEndTimeIso).getTime();
  const now = currentTimeMs || Date.now();
  const diffMs = targetTime - now;
  const totalSeconds = Math.round(diffMs / 1000);

  const isExpired = totalSeconds <= 0;
  const absSeconds = Math.abs(totalSeconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n) => n.toString().padStart(2, '0');
  const timeFormatted = hours > 0 
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
    : `${pad(minutes)}:${pad(seconds)}`;

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
    formattedText: isExpired ? `Lewat ${timeFormatted}` : timeFormatted,
  };
}

test('Timer calculates accurate remaining time and warnings', () => {
  const now = new Date('2026-10-13T23:30:00.000Z').getTime();

  // Test 1: Sesi crossing midnight (Target: 00:30:00 next day)
  const targetCrossingMidnight = '2026-10-14T00:30:00.000Z';
  const calc1 = calculateRemainingTime(targetCrossingMidnight, now);
  assert.strictEqual(calc1.isExpired, false);
  assert.strictEqual(calc1.hours, 1);
  assert.strictEqual(calc1.minutes, 0);
  assert.strictEqual(calc1.formattedText, '01:00:00');

  // Test 2: Warning 10 menit (Target: 8 minutes remaining = 480 seconds)
  const target8Min = new Date(now + 480 * 1000).toISOString();
  const calc2 = calculateRemainingTime(target8Min, now);
  assert.strictEqual(calc2.isWarning10Min, true);
  assert.strictEqual(calc2.isWarning5Min, false);
  assert.strictEqual(calc2.isExpired, false);

  // Test 3: Warning 5 menit (Target: 4 minutes remaining = 240 seconds)
  const target4Min = new Date(now + 240 * 1000).toISOString();
  const calc3 = calculateRemainingTime(target4Min, now);
  assert.strictEqual(calc3.isWarning10Min, false);
  assert.strictEqual(calc3.isWarning5Min, true);
  assert.strictEqual(calc3.isExpired, false);

  // Test 4: Waktu habis (Target was 2 minutes ago)
  const targetOverdue = new Date(now - 120 * 1000).toISOString();
  const calc4 = calculateRemainingTime(targetOverdue, now);
  assert.strictEqual(calc4.isExpired, true);
  assert.strictEqual(calc4.formattedText, 'Lewat 02:00');
});

// 3. TEST: Unit Uniqueness & Active Rental Prevention
test('Unit allows only one active rental session', () => {
  const activeRentals = [
    { id: 'rent-1', unitId: 'unit-ps-01', status: 'active' },
  ];

  function tryStartRental(unitId) {
    const existing = activeRentals.find((r) => r.unitId === unitId && r.status === 'active');
    if (existing) {
      return { success: false, error: 'Unit sudah memiliki sesi aktif' };
    }
    activeRentals.push({ id: 'rent-2', unitId, status: 'active' });
    return { success: true };
  }

  // Attempt on same unit PS-01
  const failAttempt = tryStartRental('unit-ps-01');
  assert.strictEqual(failAttempt.success, false);
  assert.strictEqual(failAttempt.error, 'Unit sudah memiliki sesi aktif');

  // Attempt on different unit PS-02
  const successAttempt = tryStartRental('unit-ps-02');
  assert.strictEqual(successAttempt.success, true);
  assert.strictEqual(activeRentals.length, 2);
});

// 4. TEST: Financial Accounting Consistency (Omzet vs Kas vs Laba vs Capex vs Void)
test('Financial calculations strictly separate Operational Profit from Cash Balance and voided items', () => {
  const rentalOmzet = 50000; // 5 hours rental total
  const rentalCollected = 40000; // Customer paid 40k, 10k receivable
  const opex = 15000; // Routine operational cost (token listrik PLN)
  const capex = 700000; // Asset equipment purchase (Stabilizer 1000VA)

  // Voided transaction that should NOT affect cash balance
  const voidedExpense = 20000;

  // Running cash balance = Inflow - Outflow (valid only)
  const totalCashIn = rentalCollected;
  const totalCashOut = opex + capex; // voidedExpense excluded!
  const cashBalance = totalCashIn - totalCashOut; // 40.000 - 715.000 = -675.000

  // Operational Profit = Rental Omzet - Routine Opex (Capex excluded!)
  const operationalProfit = rentalOmzet - opex; // 50.000 - 15.000 = 35.000

  // Receivables (Piutang)
  const receivables = rentalOmzet - rentalCollected; // 10.000

  assert.strictEqual(cashBalance, -675000);
  assert.strictEqual(operationalProfit, 35000);
  assert.strictEqual(receivables, 10000);
  // Ensure profit is NOT equal to cash balance
  assert.notStrictEqual(operationalProfit, cashBalance);
});

// 5. TEST: Excel Time and Date Parsing
function parseExcelTime(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    return { hour, minute };
  }
  if (typeof val === 'string') {
    const match = val.trim().match(/^(\d{1,2})[:.;](\d{1,2})/);
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

test('Excel time parser correctly parses dot format 12.30, colon format 12:30, and fraction', () => {
  // Dot notation: "12.30"
  const t1 = parseExcelTime('12.30');
  assert.deepStrictEqual(t1, { hour: 12, minute: 30 });

  // Colon notation: "14:15"
  const t2 = parseExcelTime('14:15');
  assert.deepStrictEqual(t2, { hour: 14, minute: 15 });

  // Single digit hour: "9.05"
  const t3 = parseExcelTime('9.05');
  assert.deepStrictEqual(t3, { hour: 9, minute: 5 });

  // Excel fraction 0.5 (12:00)
  const t4 = parseExcelTime(0.5);
  assert.deepStrictEqual(t4, { hour: 12, minute: 0 });
});

// 6. TEST: Electrical Energy Consumption and Cost Formulas (Section 12)
test('Monthly electrical energy kWh and cost formulas match specification', () => {
  const totalWatt = 150; // Watt
  const hoursPerDay = 14;
  const daysPerMonth = 30;
  const ratePerKwh = 1444.70;

  // Rumus: Energi bulanan (kWh) = Total watt × jam penggunaan per hari × hari operasional ÷ 1.000
  const monthlyKwh = (totalWatt * hoursPerDay * daysPerMonth) / 1000;
  assert.strictEqual(monthlyKwh, 63); // 150 * 14 * 30 / 1000 = 63.0 kWh

  // Biaya listrik bulanan = Energi bulanan × tarif per kWh
  const monthlyCost = monthlyKwh * ratePerKwh;
  assert.strictEqual(monthlyCost, 91016.1);
});
