// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EXCEL IMPORT & EXPORT
// Handles sheets: Logbook Harian, Buku Kas Harian, Estimasi Peralatan Listrik
// Dry run preview, duplicate detection, ambiguous status confirmation
// ==============================================================================

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { excelService } from '@/services/excelService';
import { localEngine } from '@/lib/mockEngine';
import { useToast } from '@/context/ToastContext';
import { ImportParsedRow, ImportBatchSummary } from '@/types';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { formatRupiah } from '@/utils/formatters';
import { Badge } from '@/components/common/Badge';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Play,
  RotateCcw,
  Clock,
  Eye,
  Info,
} from 'lucide-react';

export const ExcelPage: React.FC = () => {
  const { success, warning, error } = useToast();

  // Upload & parse state
  const [file, setFile] = useState<File | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookInstance, setWorkbookInstance] = useState<XLSX.WorkBook | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dryRunMessage, setDryRunMessage] = useState<string | null>(null);

  // Batch history state
  const [batches, setBatches] = useState<ImportBatchSummary[]>(
    localEngine.getState().importBatches
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.match(/\.(xlsx|xls)$/i)) {
      error('Format File Tidak Valid', 'Mohon unggah file Excel berekstensi .xlsx atau .xls');
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setDryRunMessage(null);
    setParsedRows([]);

    try {
      const res = await excelService.readWorkbookFile(selected);
      setWorkbookInstance(res.workbook);
      setDetectedSheets(res.sheetNames);

      // Auto-select first matching target sheet
      const match = res.sheetNames.find((s) =>
        ['Logbook Harian', 'Buku Kas Harian', 'Estimasi Peralatan Listrik'].includes(s)
      ) || res.sheetNames[0];

      setSelectedSheet(match);
      parseSheet(res.workbook, match);
    } catch (err: any) {
      error('Gagal Membaca File', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    let rows: ImportParsedRow[] = [];
    if (sheetName.toLowerCase().includes('logbook')) {
      rows = excelService.parseLogbookSheet(ws);
    } else if (sheetName.toLowerCase().includes('kas')) {
      rows = excelService.parseCashBookSheet(ws);
    } else if (sheetName.toLowerCase().includes('peralatan') || sheetName.toLowerCase().includes('listrik')) {
      rows = excelService.parseEquipmentSheet(ws);
    } else {
      // Default to logbook parse
      rows = excelService.parseLogbookSheet(ws);
    }

    setParsedRows(rows);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    setDryRunMessage(null);
    if (workbookInstance) {
      parseSheet(workbookInstance, sheetName);
    }
  };

  // Dry Run Validation Simulation
  const handleDryRun = async () => {
    if (!file || parsedRows.length === 0) return;
    setIsProcessing(true);
    const res = await excelService.commitImport({
      filename: file.name,
      sheetName: selectedSheet,
      rows: parsedRows,
      dryRun: true,
    });
    setDryRunMessage(res.message);
    setIsProcessing(false);
    success('Simulasi Dry Run Selesai', res.message);
  };

  // Final Commit Import to Database
  const handleCommitImport = async () => {
    if (!file || parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await excelService.commitImport({
        filename: file.name,
        sheetName: selectedSheet,
        rows: parsedRows,
        dryRun: false,
      });

      success('Impor Berhasil Disimpan', res.message);
      setBatches([...localEngine.getState().importBatches]);
      setDryRunMessage(null);
      setParsedRows([]);
      setFile(null);
    } catch (e: any) {
      error('Gagal Menyimpan Impor', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Template for easy manual testing
  const handleDownloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 1. Logbook Harian Sample
    const logbookSample = [
      {
        'Unit': 'PS-01',
        'Nama Pelanggan': 'Fajar',
        'Tanggal': '2026-10-13',
        'Jam Mulai': '14:00',
        'Durasi': 2,
        'Total': 20000,
        'Status': 'Lunas',
      },
      {
        'Unit': 'PS-02',
        'Nama Pelanggan': 'Bayu',
        'Tanggal': '2026-10-13',
        'Jam Mulai': '15:30',
        'Durasi': 1,
        'Total': 10000,
        'Status': 'CU', // Example ambiguous status to demonstrate warning verification!
      },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logbookSample), 'Logbook Harian');

    // 2. Buku Kas Harian Sample
    const cashSample = [
      {
        'Nomor': 1,
        'Tanggal': '2026-10-13',
        'Nomor Referensi': 'REF-001',
        'Keterangan': 'Beli token listrik PLN rental',
        'Kas Masuk': 0,
        'Kas Keluar': 50000,
        'Saldo': 50000,
      },
      {
        'Nomor': 2,
        'Tanggal': '2026-10-13',
        'Nomor Referensi': 'INV-001',
        'Keterangan': 'Pembayaran Sewa PS-01 Fajar',
        'Kas Masuk': 20000,
        'Kas Keluar': 0,
        'Saldo': 70000,
      },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cashSample), 'Buku Kas Harian');

    // 3. Estimasi Peralatan Listrik Sample
    const eqSample = [
      {
        'Nama Komponen': 'Stabilizer 1.000 VA',
        'Spesifikasi': 'Matsunaga 1000W / Servo Motor System',
        'Kuantitas': 2,
        'Satuan': 'Unit',
        'Harga Satuan': 350000,
        'Total Biaya': 700000,
        'Daya Watt': 20,
        'Catatan': 'Pengaman tegangan PS4 dan TV',
      },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eqSample), 'Estimasi Peralatan Listrik');

    XLSX.writeFile(wb, 'Laporan_dan_Logbook_Rental_PS_Template.xlsx');
    success('Template Diunduh', 'File Excel contoh siap diisi dan diuji.');
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const warningCount = parsedRows.filter((r) => r.status === 'needs_confirmation').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Integrasi Lembar Kerja Excel</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Impor & Ekspor Data Excel (.xlsx)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Sinkronkan data historis dari workbook <code className="text-emerald-300">Laporan_dan_Logbook_Rental_PS.xlsx</code> dengan deteksi multi-sheet otomatis, dry run, dan verifikasi status ambigu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadSampleTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
            title="Download template Excel standar 3 sheet"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Unduh Format Template</span>
          </button>

          <button
            onClick={() => excelService.exportAllMasterReport()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Ekspor Seluruh Database</span>
          </button>
        </div>
      </div>

      {/* UPLOAD & PARSER PANEL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Upload File Excel Sumber</span>
        </h3>

        {/* Drag & Drop Upload Zone */}
        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-slate-950/40">
          <input
            type="file"
            id="excelFileInput"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excelFileInput" className="cursor-pointer block space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {file ? file.name : 'Klik untuk memilih file Excel atau seret file ke sini'}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Mendukung file: <strong className="text-slate-300">Laporan_dan_Logbook_Rental_PS.xlsx</strong> atau file XLSX standar
              </span>
            </div>
          </label>
        </div>

        {/* Detected Sheets Selector */}
        {detectedSheets.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-semibold">
                Pilih Sheet yang Ingin Diproses:
              </span>
              <div className="flex flex-wrap gap-2">
                {detectedSheets.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSheetChange(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedSheet === name
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Counts Summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">Total Baris: <strong>{parsedRows.length}</strong></span>
              <span className="text-emerald-400">Siap Impor: <strong>{validCount}</strong></span>
              {warningCount > 0 && (
                <span className="text-amber-400">Perlu Konfirmasi (Status Ambigu): <strong>{warningCount}</strong></span>
              )}
              {invalidCount > 0 && (
                <span className="text-rose-400">Bermasalah: <strong>{invalidCount}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Dry Run Message Box */}
        {dryRunMessage && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{dryRunMessage}</span>
            </div>
          </div>
        )}

        {/* PREVIEW TABLE */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Pratinjau Data ({selectedSheet})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDryRun}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span>Uji Simulasi (Dry Run)</span>
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={isProcessing || validCount === 0}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Baris</th>
                    <th className="py-2.5 px-3">Status Validasi</th>
                    <th className="py-2.5 px-4">Data Hasil Parsing</th>
                    <th className="py-2.5 px-3">Peringatan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`hover:bg-slate-900/40 ${
                        row.status === 'invalid'
                          ? 'bg-rose-950/10'
                          : row.status === 'needs_confirmation'
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{row.rowIndex}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            row.status === 'valid'
                              ? 'success'
                              : row.status === 'needs_confirmation'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {row.status === 'valid'
                            ? 'Valid'
                            : row.status === 'needs_confirmation'
                            ? 'Perlu Konfirmasi'
                            : 'Gagal'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">
                        {JSON.stringify(row.parsedData)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {row.warnings.map((w, i) => (
                          <span key={i} className="text-amber-400 block">
                            • {w}
                          </span>
                        ))}
                        {row.errors.map((err, i) => (
                          <span key={i} className="text-rose-400 block">
                            • {err}
                          </span>
                        ))}
                        {row.warnings.length === 0 && row.errors.length === 0 && (
                          <span className="text-emerald-400">Siap disimpan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* IMPORT BATCH HISTORY */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Riwayat Batch Impor Excel
        </h3>

        {batches.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl">
            Belum ada riwayat batch impor data Excel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Waktu Impor</th>
                  <th className="py-2.5 px-3">Nama File</th>
                  <th className="py-2.5 px-3">Sheet</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3 text-center">Berhasil</th>
                  <th className="py-2.5 px-3 text-center">Gagal</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-400">
                      {formatIndonesianDateTime(b.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{b.filename}</td>
                    <td className="py-2.5 px-3 text-purple-300 font-mono">{b.sheetName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{b.importedByName || 'System'}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold font-mono">
                      {b.successfulRows}
                    </td>
                    <td className="py-2.5 px-3 text-center text-rose-400 font-bold font-mono">
                      {b.failedRows}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 italic text-[11px]">
                      {b.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
