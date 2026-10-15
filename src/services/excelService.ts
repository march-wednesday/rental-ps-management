// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EXCEL SERVICE (XLSX Import & Export)
// Supports sheets: Logbook Harian, Buku Kas Harian, Estimasi Peralatan Listrik
// Compatible with Microsoft Excel & LibreOffice Calc
// ==============================================================================

import * as XLSX from 'xlsx';
import { localEngine } from '@/lib/mockEngine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatRupiah, formatNumber } from '@/utils/formatters';
import { parseExcelDate, parseExcelTime, formatIndonesianDateTime, formatIndonesianDate } from '@/utils/dateUtils';
import { ImportParsedRow, ImportBatchSummary, RentalSession, CashTransaction, EquipmentItem } from '@/types';

// Normalization helper for Unit codes
export function normalizeUnitCode(raw: any): string {
  if (!raw) return 'PS-01';
  const str = String(raw).trim().toUpperCase();
  if (str.includes('2') || str.includes('PS2') || str.includes('PS-02') || str.includes('UNIT 2') || str.includes('PS 2')) {
    return 'PS-02';
  }
  return 'PS-01';
}

function parseTimeField(val: any): string {
  if (val === null || val === undefined || val === '') return '12:00';
  if (typeof val === 'number') {
    const frac = val < 1 ? val : val - Math.floor(val);
    if (frac > 0) {
      const totalMinutes = Math.round(frac * 24 * 60);
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

function parseDurationMinutesField(durVal: any, price: number): number {
  if (!durVal) {
    if (price && price >= 20000) return 120;
    return 60;
  }
  if (typeof durVal === 'number') {
    return durVal < 10 ? Math.round(durVal * 60) : durVal;
  }
  const s = String(durVal).toLowerCase().replace(',', '.');
  const match = s.match(/([0-9.]+)/);
  if (match) {
    const hours = parseFloat(match[1]);
    return Math.round(hours * 60);
  }
  return price >= 20000 ? 120 : 60;
}

export const excelService = {
  /**
   * Parse uploaded workbook file and return sheet names & summary
   */
  async readWorkbookFile(file: File): Promise<{
    workbook: XLSX.WorkBook;
    sheetNames: string[];
    fileHash: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          let hashSum = file.size;
          for (let i = 0; i < Math.min(data.length, 100); i++) {
            hashSum = (hashSum * 31 + data[i]) % 1000000007;
          }
          const fileHash = `hash-${hashSum}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

          resolve({
            workbook,
            sheetNames: workbook.SheetNames,
            fileHash,
          });
        } catch (err) {
          reject(new Error('Gagal membaca format file Excel. Pastikan file berformat .xlsx atau .xls yang valid.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal memproses file.'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Parse and validate Sheet "Logbook Harian"
   * Handles both template format and user's operational Excel structure
   */
  parseLogbookSheet(worksheet: XLSX.WorkSheet): ImportParsedRow[] {
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawRows.length < 2) return [];

    // Find actual table header row (skipping top banner rows with only 1 cell)
    let headerRowIndex = 3; // Default to row 3 (0-indexed) for user excel
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = (rawRows[i] || []).map((cell: any) => String(cell || '').trim().toLowerCase());
      const hasUnit = row.some((c: string) => c === 'unit' || c.includes('konsol') || c.includes('no ps'));
      const hasCustomer = row.some((c: string) => c.includes('penyewa') || c.includes('pelanggan') || c === 'nama');
      const hasTime = row.some((c: string) => c.includes('mulai') || c.includes('waktu') || c.includes('jam'));
      const nonEmptyCols = row.filter((c: string) => c !== '').length;

      if (hasUnit && (hasCustomer || hasTime) && nonEmptyCols >= 4) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    // Day tracking logic (Day 1: 2026-10-09, Day 2: 2026-10-10, Day 3: 2026-10-11, Day 4: 2026-10-12)
    let currentDay = 1;
    const dayDates: Record<number, string> = {
      1: '2026-10-09',
      2: '2026-10-10',
      3: '2026-10-11',
      4: '2026-10-12',
    };

    // Find header column indices
    const colUnitIdx = headers.findIndex((h) => /unit|konsol|no\s*ps/i.test(h));
    const colCustIdx = headers.findIndex((h) => /penyewa|pelanggan|nama/i.test(h));
    const colStartIdx = headers.findIndex((h) => /jam\s*mulai|waktu\s*mulai|mulai/i.test(h));
    const colEndIdx = headers.findIndex((h) => /jam\s*selesai|waktu\s*selesai|selesai/i.test(h));
    const colDurIdx = headers.findIndex((h) => /durasi|lama/i.test(h));
    const colPriceIdx = headers.findIndex((h) => /biaya|total|tarif|harga/i.test(h));
    const colStatusIdx = headers.findIndex((h) => /status|keterangan/i.test(h));
    const colDateIdx = headers.findIndex((h) => /tanggal|date/i.test(h));

    dataRows.forEach((row, idx) => {
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      // Check row for day indicator markers
      const rowStr = row.map((c: any) => String(c || '').toLowerCase()).join(' ');
      if (rowStr.includes('day 2')) currentDay = 2;
      else if (rowStr.includes('day 3')) currentDay = 3;
      else if (rowStr.includes('day 4')) currentDay = 4;

      // Extract raw column values
      const rawUnit = colUnitIdx !== -1 ? row[colUnitIdx] : (row[1] || row[0]);
      const rawCust = colCustIdx !== -1 ? row[colCustIdx] : (row[2] || row[1]);
      const rawStart = colStartIdx !== -1 ? row[colStartIdx] : row[3];
      const rawEnd = colEndIdx !== -1 ? row[colEndIdx] : row[4];
      const rawDur = colDurIdx !== -1 ? row[colDurIdx] : row[5];
      const rawPrice = colPriceIdx !== -1 ? row[colPriceIdx] : (row[7] || row[6] || row[5]);
      const rawStatus = colStatusIdx !== -1 ? row[colStatusIdx] : (row[9] || row[8] || row[6]);
      const rawDate = colDateIdx !== -1 ? row[colDateIdx] : null;

      // If unit and customer are missing, skip row
      if (!rawUnit && !rawCust) return;

      const errors: string[] = [];
      const warnings: string[] = [];
      let status: 'valid' | 'invalid' | 'needs_confirmation' | 'duplicate' = 'valid';

      const normalizedUnit = normalizeUnitCode(rawUnit);
      const customerName = String(rawCust || '').trim() || 'Pelanggan';

      let price = 10000;
      if (typeof rawPrice === 'number') {
        price = rawPrice;
      } else if (rawPrice) {
        const pNum = parseFloat(String(rawPrice).replace(/[^0-9]/g, ''));
        if (!isNaN(pNum) && pNum > 0) price = pNum;
      }

      const durationMinutes = parseDurationMinutesField(rawDur, price);
      const startTimeStr = parseTimeField(rawStart);
      const endTimeStr = parseTimeField(rawEnd);

      // Determine date
      let datePrefix = dayDates[currentDay] || '2026-10-09';
      if (rawDate) {
        const pDate = parseExcelDate(rawDate);
        if (pDate) datePrefix = pDate.split('T')[0];
      }

      const startIso = `${datePrefix}T${startTimeStr}:00+08:00`;
      const endIso = `${datePrefix}T${endTimeStr}:00+08:00`;

      // Status check
      const statusText = String(rawStatus || '').trim().toLowerCase();
      let finalPaymentStatus: 'Belum Bayar' | 'Sebagian' | 'Lunas' = 'Lunas';

      if (statusText === 'cu' || statusText.includes('pending') || statusText.includes('cuti')) {
        status = 'needs_confirmation';
        warnings.push(`Status "${rawStatus}" adalah CU/Pending. Memerlukan konfirmasi pembayaran.`);
        finalPaymentStatus = 'Belum Bayar';
      } else if (statusText.includes('belum') || statusText.includes('utang')) {
        finalPaymentStatus = 'Belum Bayar';
      } else if (statusText.includes('lunas') || statusText === '') {
        finalPaymentStatus = 'Lunas';
      }

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colI) => {
        rawObj[h || `Kolom_${colI + 1}`] = row[colI];
      });

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Logbook Harian',
        rawData: rawObj,
        parsedData: {
          unitCode: normalizedUnit,
          customerName,
          date: startIso,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes,
          totalPrice: price,
          paymentStatus: finalPaymentStatus,
          notes: `Impor Excel Day ${currentDay} (${finalPaymentStatus})`,
        },
        status,
        errors,
        warnings,
      });
    });

    return parsedList;
  },

  /**
   * Parse and validate Sheet "Buku Kas Harian"
   */
  parseCashBookSheet(worksheet: XLSX.WorkSheet): ImportParsedRow[] {
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawRows.length < 2) return [];

    let headerRowIndex = 3;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = (rawRows[i] || []).map((cell: any) => String(cell || '').trim().toLowerCase());
      if (row.some((c: string) => c.includes('keterangan') || c.includes('masuk') || c.includes('keluar') || c.includes('saldo'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    const colDateIdx = headers.findIndex((h) => /tanggal|date/i.test(h));
    const colRefIdx = headers.findIndex((h) => /ref|nomor/i.test(h));
    const colDescIdx = headers.findIndex((h) => /keterangan|uraian|deskripsi/i.test(h));
    const colInIdx = headers.findIndex((h) => /masuk|debet|in/i.test(h));
    const colOutIdx = headers.findIndex((h) => /keluar|kredit|out/i.test(h));

    dataRows.forEach((row, idx) => {
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      const descVal = colDescIdx !== -1 ? row[colDescIdx] : (row[3] || row[2]);
      const inVal = colInIdx !== -1 ? row[colInIdx] : (row[4] || 0);
      const outVal = colOutIdx !== -1 ? row[colOutIdx] : (row[5] || 0);
      const dateVal = colDateIdx !== -1 ? row[colDateIdx] : row[1];
      const refVal = colRefIdx !== -1 ? row[colRefIdx] : row[2];

      const numIn = typeof inVal === 'number' ? inVal : parseFloat(String(inVal).replace(/[^0-9]/g, '')) || 0;
      const numOut = typeof outVal === 'number' ? outVal : parseFloat(String(outVal).replace(/[^0-9]/g, '')) || 0;

      if (numIn === 0 && numOut === 0 && !descVal) return;

      const txType: 'in' | 'out' = numIn > 0 ? 'in' : 'out';
      const amount = txType === 'in' ? numIn : numOut;

      let categoryName = txType === 'in' ? 'Pendapatan Rental' : 'Operasional lainnya';
      const d = String(descVal || '').toLowerCase();
      if (d.includes('listrik') || d.includes('token')) categoryName = 'Listrik';
      else if (d.includes('wifi') || d.includes('internet')) categoryName = 'Internet';
      else if (d.includes('stik') || d.includes('aksesori')) categoryName = 'Aksesori';
      else if (d.includes('beli') && (d.includes('ps') || d.includes('tv') || d.includes('stabilizer'))) {
        categoryName = 'Pembelian peralatan';
      }

      let parsedDate = '2026-10-09T22:00:00+08:00';
      if (dateVal) {
        const pd = parseExcelDate(dateVal);
        if (pd) parsedDate = pd;
      }

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colI) => {
        rawObj[h || `Kolom_${colI + 1}`] = row[colI];
      });

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Buku Kas Harian',
        rawData: rawObj,
        parsedData: {
          date: parsedDate,
          referenceNo: String(refVal || '').trim(),
          description: String(descVal || 'Transaksi Kas').trim(),
          type: txType,
          amount,
          categoryName,
          isCapitalAsset: categoryName === 'Pembelian peralatan',
        },
        status: 'valid',
        errors: [],
        warnings: [],
      });
    });

    return parsedList;
  },

  /**
   * Parse and validate Sheet "Estimasi Peralatan Listrik"
   */
  parseEquipmentSheet(worksheet: XLSX.WorkSheet): ImportParsedRow[] {
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawRows.length < 2) return [];

    let headerRowIndex = 3;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = (rawRows[i] || []).map((cell: any) => String(cell || '').trim().toLowerCase());
      if (row.some((c: string) => c.includes('komponen') || c.includes('peralatan') || c.includes('kuantitas') || c.includes('biaya'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    dataRows.forEach((row, idx) => {
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      const nameVal = row[1] || row[0];
      const specVal = row[2] || '';
      const qtyVal = row[3] || '1 Unit';
      const priceVal = row[4] || 0;

      if (!nameVal || typeof row[0] === 'string' && row[0].toLowerCase().includes('total')) return;

      const rawQtyStr = String(qtyVal);
      const qtyMatch = rawQtyStr.match(/([0-9.]+)/);
      const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const unitType = rawQtyStr.replace(/[0-9.]/g, '').trim() || 'Unit';

      const totalPrice = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal).replace(/[^0-9]/g, '')) || 0;
      const unitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : totalPrice;

      let wattage = 0;
      const n = String(nameVal).toLowerCase();
      if (n.includes('stabilizer')) wattage = 20;
      else if (n.includes('kipas')) wattage = 55;
      else if (n.includes('lampu')) wattage = 14;

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colI) => {
        rawObj[h || `Kolom_${colI + 1}`] = row[colI];
      });

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Estimasi Peralatan Listrik',
        rawData: rawObj,
        parsedData: {
          name: String(nameVal).trim(),
          specification: String(specVal).trim(),
          quantity,
          unit: unitType,
          unitPrice,
          totalPrice,
          wattage,
          notes: 'Komponen kelistrikan rental',
        },
        status: 'valid',
        errors: [],
        warnings: [],
      });
    });

    return parsedList;
  },

  /**
   * Commit confirmed parsed rows into Supabase Cloud & Local Database
   */
  async commitImport(params: {
    filename: string;
    sheetName: string;
    rows: ImportParsedRow[];
    dryRun: boolean;
  }): Promise<{ success: boolean; importedCount: number; skippedCount: number; message: string }> {
    if (params.dryRun) {
      const validCount = params.rows.filter((r) => r.status === 'valid' || r.status === 'needs_confirmation').length;
      return {
        success: true,
        importedCount: validCount,
        skippedCount: params.rows.length - validCount,
        message: `Simulasi Dry Run Berhasil: ${validCount} baris siap diimpor, ${params.rows.length - validCount} baris bermasalah.`,
      };
    }

    let importedCount = 0;
    let skippedCount = 0;
    const engine = localEngine;
    const state = engine.getState();

    if (params.sheetName === 'Logbook Harian') {
      const newRentals: RentalSession[] = [];
      const supabasePayloads: any[] = [];

      // Fetch units from Supabase for ID matching
      let unitMap: Record<string, string> = {
        'PS-01': '028ea2d7-c00a-410b-b660-d73dc2ff536b',
        'PS-02': '2ac6a322-a4fe-41a1-9bc0-b6a280dd13fc',
      };

      if (isSupabaseConfigured) {
        try {
          const { data: dbUnits } = await supabase.from('units').select('id, code');
          if (dbUnits && dbUnits.length > 0) {
            dbUnits.forEach((u: any) => {
              unitMap[u.code] = u.id;
            });
          }
        } catch (e) {
          console.warn('Could not fetch units from Supabase:', e);
        }
      }

      params.rows.forEach((row, i) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        const rentalId = `imp-rent-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
        const rentalCode = `RENT-IMP-${Math.floor(10000 + Math.random() * 90000)}`;
        const startIso = data.date || new Date().toISOString();
        const endIso = data.endTime ? startIso : startIso;
        const unitId = unitMap[data.unitCode] || (data.unitCode === 'PS-02' ? 'unit-ps-02' : 'unit-ps-01');

        const session: RentalSession = {
          id: rentalId,
          rentalCode,
          unitId,
          unitCode: data.unitCode,
          unitName: data.unitCode === 'PS-02' ? 'PS4 Unit 2' : 'PS4 Unit 1',
          customerName: data.customerName,
          durationMinutes: data.durationMinutes,
          startTime: startIso,
          targetEndTime: endIso,
          actualEndTime: endIso,
          status: 'completed',
          totalPrice: data.totalPrice,
          totalPaid: data.paymentStatus === 'Lunas' ? data.totalPrice : 0,
          paymentStatus: data.paymentStatus,
          notes: data.notes || 'Diimpor dari file Excel Logbook Harian',
          createdAt: startIso,
        };

        newRentals.push(session);

        if (isSupabaseConfigured && unitMap[data.unitCode]) {
          supabasePayloads.push({
            rental_code: rentalCode,
            unit_id: unitMap[data.unitCode],
            customer_name: data.customerName,
            customer_phone: null,
            duration_minutes: data.durationMinutes,
            start_time: startIso,
            target_end_time: endIso,
            actual_end_time: endIso,
            status: 'completed',
            total_price: data.totalPrice,
            total_paid: data.paymentStatus === 'Lunas' ? data.totalPrice : 0,
            payment_status: data.paymentStatus,
            notes: data.notes || 'Diimpor dari file Excel Logbook Harian',
            created_at: startIso,
          });
        }

        importedCount++;
      });

      // 1. Insert into Supabase Cloud
      if (isSupabaseConfigured && supabasePayloads.length > 0) {
        try {
          const { error: sbErr } = await supabase.from('rentals').insert(supabasePayloads);
          if (sbErr) console.warn('Supabase bulk insert rentals warning:', sbErr);
          else console.log(`✅ ${supabasePayloads.length} rentals synced to Supabase Cloud!`);
        } catch (err) {
          console.warn('Supabase insert error:', err);
        }
      }

      // 2. Insert into LocalEngine and persist immediately
      engine.addImportedRentals(newRentals);

      // 3. Notify app components
      window.dispatchEvent(new CustomEvent('rental-data-updated'));
    } else if (params.sheetName === 'Buku Kas Harian') {
      const newCash: CashTransaction[] = [];
      const supabaseCash: any[] = [];

      let catId: string | null = null;
      if (isSupabaseConfigured) {
        try {
          const { data: cats } = await supabase.from('cash_categories').select('id, name');
          catId = cats?.[0]?.id || null;
        } catch {}
      }

      params.rows.forEach((row, i) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        const txNo = `CSH-${data.type.toUpperCase()}-IMP-${Date.now().toString().slice(-4)}${i}`;

        const tx: CashTransaction = {
          id: `imp-csh-${Date.now()}-${i}`,
          transactionNo: txNo,
          transactionDate: data.date,
          categoryName: data.categoryName,
          type: data.type,
          amount: data.amount,
          referenceNo: data.referenceNo || `REF-IMP-${i + 1}`,
          description: data.description,
          isCapitalAsset: Boolean(data.isCapitalAsset),
          status: 'valid',
          createdAt: data.date,
        };

        newCash.push(tx);

        if (isSupabaseConfigured) {
          supabaseCash.push({
            transaction_no: txNo,
            transaction_date: data.date,
            category_id: catId,
            type: data.type,
            amount: data.amount,
            reference_no: data.referenceNo || null,
            description: data.description,
            is_capital_asset: Boolean(data.isCapitalAsset),
            status: 'valid',
            created_at: data.date,
          });
        }

        importedCount++;
      });

      if (isSupabaseConfigured && supabaseCash.length > 0) {
        try {
          await supabase.from('cash_transactions').insert(supabaseCash);
        } catch {}
      }

      engine.addImportedCashTransactions(newCash);
      window.dispatchEvent(new CustomEvent('cash-data-updated'));
    } else if (params.sheetName === 'Estimasi Peralatan Listrik') {
      const newEq: EquipmentItem[] = [];

      params.rows.forEach((row, i) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        const eqItem: EquipmentItem = {
          id: `eq-imp-${Date.now()}-${i}`,
          name: data.name,
          specification: data.specification,
          quantity: data.quantity,
          unit: data.unit,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice,
          wattage: data.wattage,
          notes: data.notes,
          category: 'Peralatan Listrik',
        };

        newEq.push(eqItem);
        importedCount++;
      });

      if (isSupabaseConfigured && newEq.length > 0) {
        try {
          const payloads = newEq.map((e) => ({
            name: e.name,
            specification: e.specification || null,
            quantity: e.quantity,
            unit: e.unit,
            unit_price: e.unitPrice,
            wattage: e.wattage,
            notes: e.notes || null,
            category: e.category,
          }));
          await supabase.from('equipment').insert(payloads);
        } catch (eqErr) {
          console.warn('Supabase equipment batch insert warning:', eqErr);
        }
      }

      engine.addImportedEquipment(newEq);
      window.dispatchEvent(new CustomEvent('equipment-data-updated'));
    }

    // Record Batch History
    const batchSummary: ImportBatchSummary = {
      id: `batch-${Date.now()}`,
      filename: params.filename,
      sheetName: params.sheetName,
      totalRows: params.rows.length,
      successfulRows: importedCount,
      failedRows: skippedCount,
      importedByName: state.currentUser.fullName,
      createdAt: new Date().toISOString(),
      notes: `Berhasil mengimpor ${importedCount} data ke database Supabase & lokal`,
    };
    engine.addImportBatch(batchSummary);

    return {
      success: true,
      importedCount,
      skippedCount,
      message: `Impor Berhasil: ${importedCount} baris data berhasil disimpan ke Database Cloud & Logbook Harian.`,
    };
  },

  // ==========================================
  // EXPORT UTILITIES (XLSX)
  // ==========================================

  /**
   * Export Logbook Harian to Excel
   */
  exportLogbook() {
    const rentals = localEngine.getState().rentals;
    const rows = rentals.map((r, idx) => ({
      'No': idx + 1,
      'Kode Rental': r.rentalCode,
      'Unit PS': r.unitCode,
      'Nama Pelanggan': r.customerName,
      'Telepon': r.customerPhone || '-',
      'Paket / Durasi': `${r.durationMinutes} Menit`,
      'Waktu Mulai': formatIndonesianDateTime(r.startTime),
      'Target Selesai': formatIndonesianDateTime(r.targetEndTime),
      'Status Rental': r.status === 'active' ? 'Sedang Berjalan' : r.status === 'completed' ? 'Selesai' : 'Dibatalkan',
      'Total Biaya': r.totalPrice,
      'Dibayar': r.totalPaid,
      'Status Bayar': r.paymentStatus,
      'Catatan': r.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logbook Harian');
    XLSX.writeFile(workbook, `Logbook_Rental_PS_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Export Buku Kas Harian to Excel
   */
  exportCashBook() {
    const txs = localEngine.getState().cashTransactions;
    // Chronological order for standard balance ledger
    const sorted = [...txs].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    let balance = 0;
    const rows = sorted.map((t, idx) => {
      if (t.status !== 'void') {
        if (t.type === 'in') balance += t.amount;
        else balance -= t.amount;
      }
      return {
        'No': idx + 1,
        'No Transaksi': t.transactionNo,
        'Tanggal': formatIndonesianDateTime(t.transactionDate),
        'Kategori': t.categoryName,
        'Keterangan': t.description,
        'No Referensi': t.referenceNo || '-',
        'Kas Masuk': t.type === 'in' && t.status !== 'void' ? t.amount : 0,
        'Kas Keluar': t.type === 'out' && t.status !== 'void' ? t.amount : 0,
        'Saldo': balance,
        'Jenis Aset': t.isCapitalAsset ? 'Aset / Modal' : 'Operasional Rutin',
        'Status': t.status === 'void' ? `VOID (${t.voidReason || '-'})` : 'Valid',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Kas Harian');
    XLSX.writeFile(workbook, `Buku_Kas_Rental_PS_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Export Estimasi Peralatan Listrik to Excel
   */
  exportEquipment() {
    const equipment = localEngine.getState().equipment;
    const rows = equipment.map((eq, idx) => ({
      'No': idx + 1,
      'Nama Komponen': eq.name,
      'Spesifikasi': eq.specification || '-',
      'Kuantitas': eq.quantity,
      'Satuan': eq.unit,
      'Harga Satuan': eq.unitPrice,
      'Total Biaya': eq.totalPrice,
      'Daya Watt': eq.wattage,
      'Kategori': eq.category,
      'Catatan': eq.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estimasi Peralatan Listrik');
    XLSX.writeFile(workbook, `Estimasi_Peralatan_Listrik_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Export Complete Comprehensive Report (All sheets in single workbook)
   */
  exportAllMasterReport() {
    const workbook = XLSX.utils.book_new();

    // 1. Logbook Harian
    const rentals = localEngine.getState().rentals.map((r, i) => ({
      'No': i + 1,
      'Kode': r.rentalCode,
      'Unit': r.unitCode,
      'Pelanggan': r.customerName,
      'Durasi': `${r.durationMinutes}m`,
      'Total Tagihan': r.totalPrice,
      'Terbayar': r.totalPaid,
      'Status Bayar': r.paymentStatus,
      'Status Rental': r.status,
      'Waktu': formatIndonesianDateTime(r.startTime),
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rentals), 'Logbook Harian');

    // 2. Buku Kas Harian
    let bal = 0;
    const cash = [...localEngine.getState().cashTransactions]
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
      .map((t, i) => {
        if (t.status !== 'void') {
          bal += t.type === 'in' ? t.amount : -t.amount;
        }
        return {
          'No': i + 1,
          'Tanggal': formatIndonesianDateTime(t.transactionDate),
          'Nomor': t.transactionNo,
          'Keterangan': t.description,
          'Kategori': t.categoryName,
          'Masuk': t.type === 'in' && t.status !== 'void' ? t.amount : 0,
          'Keluar': t.type === 'out' && t.status !== 'void' ? t.amount : 0,
          'Saldo': bal,
          'Status': t.status,
        };
      });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cash), 'Buku Kas Harian');

    // 3. Estimasi Peralatan Listrik
    const eq = localEngine.getState().equipment.map((e, i) => ({
      'No': i + 1,
      'Komponen': e.name,
      'Spesifikasi': e.specification || '-',
      'Kuantitas': e.quantity,
      'Satuan': e.unit,
      'Harga Satuan': e.unitPrice,
      'Total': e.totalPrice,
      'Watt': e.wattage,
      'Catatan': e.notes || '-',
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(eq), 'Estimasi Peralatan Listrik');

    XLSX.writeFile(workbook, `Master_Laporan_Rental_PS_${new Date().toISOString().split('T')[0]}.xlsx`);
  },
};
