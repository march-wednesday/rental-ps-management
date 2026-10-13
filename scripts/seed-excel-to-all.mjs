// ==============================================================================
// PARSE EXCEL AND SEED TO SUPABASE & MOCK ENGINE
// Source: C:\Users\hence\Downloads\Laporan_dan_Logbook_Rental_PS.xlsx
// ==============================================================================

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_PATH = 'C:\\Users\\hence\\Downloads\\Laporan_dan_Logbook_Rental_PS.xlsx';

function parseExcelTime(val) {
  if (val === null || val === undefined || val === '') return '12:00';
  if (typeof val === 'number') {
    if (val < 1) {
      // Fraction of a day
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    // Excel serial date / time
    const fractional = val - Math.floor(val);
    if (fractional > 0) {
      const totalMinutes = Math.round(fractional * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return '12:00';
  }
  const str = String(val).trim().replace('.', ':');
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return '12:00';
}

function parseDurationMinutes(durStr, price) {
  if (!durStr) {
    if (price && price >= 20000) return 120;
    return 60;
  }
  const s = String(durStr).toLowerCase().replace(',', '.');
  const match = s.match(/([0-9.]+)/);
  if (match) {
    const hours = parseFloat(match[1]);
    return Math.round(hours * 60);
  }
  return 60;
}

export function parseAllData() {
  const wb = xlsx.readFile(EXCEL_PATH);

  // 1. LOGBOOK HARIAN
  const wsLogbook = wb.Sheets['Logbook Harian'];
  const logRows = xlsx.utils.sheet_to_json(wsLogbook, { header: 1 });

  let currentDay = 1;
  const dayDates = {
    1: '2026-10-09',
    2: '2026-10-10',
    3: '2026-10-11',
    4: '2026-10-12',
  };

  const parsedRentals = [];

  for (let i = 4; i < logRows.length; i++) {
    const r = logRows[i];
    if (!r || r.length < 3 || !r[1] || !r[2]) continue;

    // Check if column indicates day change
    const extraCol = r[10] ? String(r[10]).trim().toLowerCase() : '';
    if (extraCol.includes('day 2')) currentDay = 2;
    else if (extraCol.includes('day 3')) currentDay = 3;
    else if (extraCol.includes('day 4')) currentDay = 4;

    const rawUnit = String(r[1]).trim().toUpperCase().replace(/\s+/g, '-');
    const unitCode = rawUnit.includes('2') ? 'PS-02' : 'PS-01';
    const customerName = String(r[2]).trim();
    const startTimeStr = parseExcelTime(r[3]);
    const endTimeStr = parseExcelTime(r[4]);
    const price = Number(r[7]) || (r[8] && typeof r[8] === 'number' ? Number(r[8]) : 10000);
    const durationMinutes = parseDurationMinutes(r[5], price);

    const rawStatus = r[9] ? String(r[9]).trim().toLowerCase() : (r[8] ? String(r[8]).trim().toLowerCase() : '');
    const isPaid = rawStatus.includes('lunas');
    const isCU = rawStatus.includes('cu') || rawStatus === '';

    const datePrefix = dayDates[currentDay] || '2026-10-09';
    const startIso = `${datePrefix}T${startTimeStr}:00+08:00`;
    const endIso = `${datePrefix}T${endTimeStr}:00+08:00`;

    const rentalId = `rent-excel-d${currentDay}-${String(parsedRentals.length + 1).padStart(3, '0')}`;
    const rentalCode = `RENT-202610${String(8 + currentDay).padStart(2, '0')}-${String(parsedRentals.length + 1).padStart(3, '0')}`;

    parsedRentals.push({
      id: rentalId,
      rentalCode,
      unitId: unitCode === 'PS-01' ? 'unit-ps-01' : 'unit-ps-02',
      unitCode,
      unitName: unitCode === 'PS-01' ? 'PS4 Unit 1' : 'PS4 Unit 2',
      customerName,
      customerPhone: '',
      tariffPackageName: durationMinutes >= 120 ? 'Reguler 2 Jam' : 'Reguler 1 Jam',
      durationMinutes,
      startTime: startIso,
      targetEndTime: endIso,
      actualEndTime: endIso,
      status: 'completed',
      totalPrice: price,
      totalPaid: isPaid ? price : 0,
      paymentStatus: isPaid ? 'Lunas' : 'Belum Bayar',
      notes: `Data Awal Excel Day ${currentDay} (${isCU ? 'Status CU' : 'Lunas'})`,
      createdAt: startIso,
    });
  }

  // 2. BUKU KAS HARIAN
  const wsKas = wb.Sheets['Buku Kas Harian'];
  const kasRows = xlsx.utils.sheet_to_json(wsKas, { header: 1 });
  const parsedCash = [];
  let runningBalance = 0;

  for (let i = 4; i < kasRows.length; i++) {
    const r = kasRows[i];
    if (!r || !r[3] || (!r[4] && !r[5])) continue;

    const desc = String(r[3]).trim();
    const amountIn = Number(r[4]) || 0;
    const amountOut = Number(r[5]) || 0;
    if (amountIn === 0 && amountOut === 0) continue;

    let dayNum = parsedCash.length + 1;
    if (desc.includes('Day 2')) dayNum = 2;
    if (desc.includes('Day 3')) dayNum = 3;
    if (desc.includes('Day 4')) dayNum = 4;

    const datePrefix = dayDates[dayNum] || '2026-10-09';
    const txType = amountIn > 0 ? 'in' : 'out';
    const amount = amountIn > 0 ? amountIn : amountOut;
    runningBalance += (txType === 'in' ? amount : -amount);

    parsedCash.push({
      id: `cash-excel-${dayNum}`,
      transactionNo: `CSH-IN-202610${String(8 + dayNum).padStart(2, '0')}-001`,
      transactionDate: `${datePrefix}T22:00:00+08:00`,
      type: txType,
      categoryName: 'Pendapatan Rental',
      amount,
      balanceAfter: runningBalance,
      description: desc,
      isCapitalAsset: false,
      status: 'valid',
      createdAt: `${datePrefix}T22:00:00+08:00`,
    });
  }

  // 3. ESTIMASI PERALATAN LISTRIK
  const wsEquip = wb.Sheets['Estimasi Peralatan Listrik'];
  const equipRows = xlsx.utils.sheet_to_json(wsEquip, { header: 1 });
  const parsedEquipment = [];

  for (let i = 4; i < equipRows.length; i++) {
    const r = equipRows[i];
    if (!r || !r[1] || typeof r[0] !== 'number') continue;

    const name = String(r[1]).trim();
    const spec = r[2] ? String(r[2]).trim() : '';
    const rawQty = r[3] ? String(r[3]).trim() : '1 Unit';
    const qtyMatch = rawQty.match(/([0-9.]+)/);
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
    const unitType = rawQty.replace(/[0-9.]/g, '').trim() || 'Unit';
    const totalPrice = Number(r[4]) || 0;
    const unitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : totalPrice;

    let wattage = 0;
    if (name.toLowerCase().includes('stabilizer')) wattage = 20;
    if (name.toLowerCase().includes('kipas')) wattage = 55;
    if (name.toLowerCase().includes('lampu')) wattage = 14;

    parsedEquipment.push({
      id: `eq-excel-${parsedEquipment.length + 1}`,
      name,
      specification: spec,
      quantity,
      unit: unitType,
      unitPrice,
      totalPrice,
      wattage,
      notes: 'Komponen instalasi listrik awal rental',
      category: 'Peralatan Listrik',
    });
  }

  return {
    rentals: parsedRentals,
    cashTransactions: parsedCash,
    equipment: parsedEquipment,
  };
}

export function writeExcelInitialDataTs() {
  const data = parseAllData();
  const fileContent = `// ==============================================================================
// INITIAL DATA IMPORTED FROM EXCEL
// Source: C:\\\\Users\\\\hence\\\\Downloads\\\\Laporan_dan_Logbook_Rental_PS.xlsx
// Generated automatically by scripts/seed-excel-to-all.mjs
// ==============================================================================

import { RentalSession, CashTransaction, EquipmentItem } from '@/types';

export const INITIAL_EXCEL_RENTALS: RentalSession[] = ${JSON.stringify(data.rentals, null, 2)};

export const INITIAL_EXCEL_CASH: CashTransaction[] = ${JSON.stringify(data.cashTransactions, null, 2)};

export const INITIAL_EXCEL_EQUIPMENT: EquipmentItem[] = ${JSON.stringify(data.equipment, null, 2)};
`;

  const targetPath = path.resolve(process.cwd(), 'src/lib/excelInitialData.ts');
  fs.writeFileSync(targetPath, fileContent, 'utf-8');
  console.log(`✅ File ${targetPath} successfully generated!`);
}

if (process.argv[1]?.endsWith('seed-excel-to-all.mjs')) {
  writeExcelInitialDataTs();
}

