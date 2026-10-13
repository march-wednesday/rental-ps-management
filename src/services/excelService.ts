// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EXCEL SERVICE (XLSX Import & Export)
// Supports sheets: Logbook Harian, Buku Kas Harian, Estimasi Peralatan Listrik
// Compatible with Microsoft Excel & LibreOffice Calc
// ==============================================================================

import * as XLSX from 'xlsx';
import { localEngine } from '@/lib/mockEngine';
import { formatRupiah, formatNumber } from '@/utils/formatters';
import { parseExcelDate, parseExcelTime, formatIndonesianDateTime, formatIndonesianDate } from '@/utils/dateUtils';
import { ImportParsedRow, ImportBatchSummary } from '@/types';

// Normalization helper for Unit codes
export function normalizeUnitCode(raw: any): string {
  if (!raw) return 'PS-01';
  const str = String(raw).trim().toUpperCase();
  if (str.includes('2') || str.includes('PS2') || str.includes('PS-02') || str.includes('UNIT 2')) {
    return 'PS-02';
  }
  return 'PS-01';
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
          // Simple hash calculation based on size + first 100 bytes
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
   */
  parseLogbookSheet(worksheet: XLSX.WorkSheet): ImportParsedRow[] {
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawRows.length < 2) return [];

    // Find header row (search for "Unit" or "Nama" or "Mulai")
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i].map((cell: any) => String(cell).toLowerCase());
      if (row.some((c: string) => c.includes('unit') || c.includes('pelanggan') || c.includes('mulai') || c.includes('tanggal'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = rawRows[headerRowIndex].map((h: any) => String(h).trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    dataRows.forEach((row, idx) => {
      // Skip completely empty rows
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        rawObj[h || `Kolom_${colIdx + 1}`] = row[colIdx];
      });

      const errors: string[] = [];
      const warnings: string[] = [];
      let status: 'valid' | 'invalid' | 'needs_confirmation' | 'duplicate' = 'valid';

      // Find relevant fields by name flexibility
      const unitVal = row[0] || rawObj['Unit'] || rawObj['No PS'] || rawObj['Konsol'] || 'PS-01';
      const customerVal = row[1] || rawObj['Nama Pelanggan'] || rawObj['Pelanggan'] || rawObj['Nama'] || 'Tamu';
      const dateVal = row[2] || rawObj['Tanggal'] || rawObj['Date'];
      const startTimeVal = row[3] || rawObj['Jam Mulai'] || rawObj['Mulai'];
      const durationVal = row[4] || rawObj['Durasi'] || rawObj['Jam'];
      const amountVal = row[5] || rawObj['Total'] || rawObj['Tarif'] || rawObj['Biaya'];
      const paymentStatusVal = String(row[6] || rawObj['Status'] || rawObj['Keterangan'] || '').trim();

      const normalizedUnit = normalizeUnitCode(unitVal);
      const parsedDate = parseExcelDate(dateVal);
      const parsedTime = parseExcelTime(startTimeVal);

      if (!parsedDate && dateVal) {
        warnings.push(`Format tanggal "${dateVal}" tidak lazim, menggunakan tanggal hari ini.`);
      }

      let durationMinutes = 60;
      if (typeof durationVal === 'number') {
        durationMinutes = durationVal < 10 ? durationVal * 60 : durationVal; // hours or minutes
      } else if (typeof durationVal === 'string') {
        const dNum = parseFloat(durationVal.replace(/[^0-9.]/g, ''));
        if (!isNaN(dNum)) {
          durationMinutes = dNum < 10 ? dNum * 60 : dNum;
        }
      }

      let parsedAmount = 0;
      if (typeof amountVal === 'number') {
        parsedAmount = amountVal;
      } else if (typeof amountVal === 'string') {
        parsedAmount = parseFloat(amountVal.replace(/[^0-9]/g, '')) || 0;
      }

      // Check ambiguous statuses like 'CU'
      let finalPaymentStatus: 'Belum Bayar' | 'Sebagian' | 'Lunas' = 'Lunas';
      if (paymentStatusVal.toUpperCase() === 'CU' || paymentStatusVal.toLowerCase().includes('cuti') || paymentStatusVal.toLowerCase().includes('pending')) {
        status = 'needs_confirmation';
        warnings.push(`Status "${paymentStatusVal}" ambigu (CU/Pending). Memerlukan konfirmasi operator.`);
        finalPaymentStatus = 'Belum Bayar';
      } else if (paymentStatusVal.toLowerCase().includes('belum') || paymentStatusVal.toLowerCase().includes('utang')) {
        finalPaymentStatus = 'Belum Bayar';
      }

      const parsedData = {
        unitCode: normalizedUnit,
        customerName: String(customerVal).trim() || 'Tamu',
        date: parsedDate || new Date().toISOString(),
        startTime: parsedTime ? `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}` : '12:00',
        durationMinutes,
        totalPrice: parsedAmount || (durationMinutes / 60) * 10000,
        paymentStatus: finalPaymentStatus,
      };

      if (errors.length > 0) {
        status = 'invalid';
      }

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Logbook Harian',
        rawData: rawObj,
        parsedData,
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

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i].map((cell: any) => String(cell).toLowerCase());
      if (row.some((c: string) => c.includes('keterangan') || c.includes('masuk') || c.includes('keluar') || c.includes('saldo'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = rawRows[headerRowIndex].map((h: any) => String(h).trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    dataRows.forEach((row, idx) => {
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        rawObj[h || `Kolom_${colIdx + 1}`] = row[colIdx];
      });

      const errors: string[] = [];
      const warnings: string[] = [];
      let status: 'valid' | 'invalid' | 'needs_confirmation' | 'duplicate' = 'valid';

      const dateVal = row[1] || rawObj['Tanggal'];
      const refVal = row[2] || rawObj['Nomor Referensi'] || rawObj['No Ref'];
      const descVal = row[3] || rawObj['Keterangan'] || rawObj['Uraian'] || 'Transaksi Kas';
      const inVal = row[4] || rawObj['Kas Masuk'] || rawObj['Debet'] || 0;
      const outVal = row[5] || rawObj['Kas Keluar'] || rawObj['Kredit'] || 0;

      const parsedDate = parseExcelDate(dateVal);
      const numIn = typeof inVal === 'number' ? inVal : parseFloat(String(inVal).replace(/[^0-9]/g, '')) || 0;
      const numOut = typeof outVal === 'number' ? outVal : parseFloat(String(outVal).replace(/[^0-9]/g, '')) || 0;

      if (numIn === 0 && numOut === 0) {
        errors.push('Nominal kas masuk dan kas keluar bernilai 0.');
        status = 'invalid';
      }

      const txType: 'in' | 'out' = numIn > 0 ? 'in' : 'out';
      const amount = txType === 'in' ? numIn : numOut;

      // Determine category based on description keywords
      let categoryName = txType === 'in' ? 'Pendapatan Rental' : 'Operasional lainnya';
      const d = String(descVal).toLowerCase();
      if (d.includes('listrik') || d.includes('token')) categoryName = 'Listrik';
      else if (d.includes('wifi') || d.includes('internet') || d.includes('indihome')) categoryName = 'Internet';
      else if (d.includes('stik') || d.includes('kabel') || d.includes('aksesori')) categoryName = 'Aksesori';
      else if (d.includes('sabun') || d.includes('sapu') || d.includes('bersih')) categoryName = 'Kebersihan';
      else if (d.includes('servis') || d.includes('pasta') || d.includes('ps')) categoryName = 'Perawatan PS';
      else if (d.includes('beli') && (d.includes('ps') || d.includes('tv') || d.includes('kipas') || d.includes('stabilizer'))) {
        categoryName = 'Pembelian peralatan';
      }

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Buku Kas Harian',
        rawData: rawObj,
        parsedData: {
          date: parsedDate || new Date().toISOString(),
          referenceNo: String(refVal || '').trim(),
          description: String(descVal).trim(),
          type: txType,
          amount,
          categoryName,
          isCapitalAsset: categoryName === 'Pembelian peralatan',
        },
        status,
        errors,
        warnings,
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

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i].map((cell: any) => String(cell).toLowerCase());
      if (row.some((c: string) => c.includes('komponen') || c.includes('peralatan') || c.includes('kuantitas') || c.includes('watt'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = rawRows[headerRowIndex].map((h: any) => String(h).trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedList: ImportParsedRow[] = [];

    dataRows.forEach((row, idx) => {
      if (!row || row.every((c: any) => c === '' || c === null || c === undefined)) return;

      const rawObj: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        rawObj[h || `Kolom_${colIdx + 1}`] = row[colIdx];
      });

      const nameVal = row[0] || rawObj['Nama Komponen'] || rawObj['Komponen'];
      const specVal = row[1] || rawObj['Spesifikasi'] || '';
      const qtyVal = row[2] || rawObj['Kuantitas'] || rawObj['Qty'] || 1;
      const unitVal = row[3] || rawObj['Satuan'] || 'Unit';
      const priceVal = row[4] || rawObj['Harga Satuan'] || 0;
      const wattVal = row[6] || rawObj['Daya Watt'] || rawObj['Watt'] || 0;
      const notesVal = row[7] || rawObj['Catatan'] || '';

      const qty = typeof qtyVal === 'number' ? qtyVal : parseFloat(String(qtyVal).replace(/[^0-9.]/g, '')) || 1;
      const price = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal).replace(/[^0-9]/g, '')) || 0;
      const watt = typeof wattVal === 'number' ? wattVal : parseFloat(String(wattVal).replace(/[^0-9.]/g, '')) || 0;

      parsedList.push({
        rowIndex: headerRowIndex + 2 + idx,
        sheetName: 'Estimasi Peralatan Listrik',
        rawData: rawObj,
        parsedData: {
          name: String(nameVal).trim() || 'Peralatan',
          specification: String(specVal).trim(),
          quantity: qty,
          unit: String(unitVal).trim() || 'Unit',
          unitPrice: price,
          totalPrice: qty * price,
          wattage: watt,
          notes: String(notesVal).trim(),
        },
        status: nameVal ? 'valid' : 'invalid',
        errors: nameVal ? [] : ['Nama komponen tidak boleh kosong.'],
        warnings: [],
      });
    });

    return parsedList;
  },

  /**
   * Commit confirmed parsed rows into LocalEngine / Database
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
      params.rows.forEach((row) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        const rentalId = `imp-rent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const startIso = data.date;

        state.rentals.push({
          id: rentalId,
          rentalCode: `RENT-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
          unitId: data.unitCode === 'PS-02' ? 'unit-ps-02' : 'unit-ps-01',
          unitCode: data.unitCode,
          unitName: data.unitCode === 'PS-02' ? 'PS4 Unit 2' : 'PS4 Unit 1',
          customerName: data.customerName,
          durationMinutes: data.durationMinutes,
          startTime: startIso,
          targetEndTime: startIso,
          actualEndTime: startIso,
          status: 'completed',
          totalPrice: data.totalPrice,
          totalPaid: data.paymentStatus === 'Lunas' ? data.totalPrice : 0,
          paymentStatus: data.paymentStatus,
          notes: 'Diimpor dari file Excel Logbook Harian',
          createdAt: startIso,
        });
        importedCount++;
      });
    } else if (params.sheetName === 'Buku Kas Harian') {
      params.rows.forEach((row) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        state.cashTransactions.push({
          id: `imp-csh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          transactionNo: `CSH-${data.type.toUpperCase()}-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
          transactionDate: data.date,
          categoryName: data.categoryName,
          type: data.type,
          amount: data.amount,
          referenceNo: data.referenceNo || `REF-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
          description: data.description,
          isCapitalAsset: Boolean(data.isCapitalAsset),
          status: 'valid',
          createdAt: data.date,
        });
        importedCount++;
      });
    } else if (params.sheetName === 'Estimasi Peralatan Listrik') {
      params.rows.forEach((row) => {
        if (row.status === 'invalid') {
          skippedCount++;
          return;
        }

        const data = row.parsedData;
        engine.addEquipment({
          name: data.name,
          specification: data.specification,
          quantity: data.quantity,
          unit: data.unit,
          unitPrice: data.unitPrice,
          wattage: data.wattage,
          notes: data.notes,
          category: 'Peralatan Listrik',
        });
        importedCount++;
      });
    }

    // Record Batch
    const batchSummary: ImportBatchSummary = {
      id: `batch-${Date.now()}`,
      filename: params.filename,
      sheetName: params.sheetName,
      totalRows: params.rows.length,
      successfulRows: importedCount,
      failedRows: skippedCount,
      importedByName: state.currentUser.fullName,
      createdAt: new Date().toISOString(),
      notes: `Berhasil mengimpor ${importedCount} data`,
    };
    engine.addImportBatch(batchSummary);

    return {
      success: true,
      importedCount,
      skippedCount,
      message: `Impor Selesai: ${importedCount} data berhasil disimpan ke database.`,
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
