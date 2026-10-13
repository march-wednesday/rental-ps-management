// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - LAPORAN KEUANGAN & LABA RUGI
// Professional P&L Statement with clear separation of Cash Balance vs Operational Profit
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';
import { excelService } from '@/services/excelService';
import { formatRupiah, formatNumber } from '@/utils/formatters';
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [summary, setSummary] = useState(financeService.getSummary());

  useEffect(() => {
    setSummary(financeService.getSummary());
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>Laporan Keuangan Eksekutif</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Laporan Laba Rugi & Arus Kas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transparansi penuh: Membedakan omzet sewa, penerimaan kas nyata, piutang, dan laba operasional bersih.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  period === p
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => excelService.exportAllMasterReport()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
            title="Download seluruh workbook master laporan Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Master Excel</span>
          </button>
        </div>
      </div>

      {/* Critical Principle Notice */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-white mb-0.5">Prinsip Akuntansi Usaha Rental</span>
          <span>
            <strong>Saldo Kas</strong> adalah sisa uang tunai fisik yang ada saat ini (Kas Masuk dikurangi Seluruh Kas Keluar). Sedangkan <strong>Laba Operasional</strong> adalah selisih antara Omzet Rental dengan Beban Operasional Rutin (tidak termasuk belanja modal aset jangka panjang). Sisa kas bukan merupakan laba bersih!
          </span>
        </div>
      </div>

      {/* DETAILED P&L STATEMENT TABLE */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Laporan Kinerja Keuangan ({period.toUpperCase()})
            </h3>
            <span className="text-xs text-slate-400">
              Mata uang: Rupiah (IDR) • Waktu operasional: WITA
            </span>
          </div>
        </div>

        <div className="space-y-4 font-mono text-xs">
          {/* 1. REVENUE (PENDAPATAN) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="font-sans">1. PENDAPATAN / OMZET SEWA</span>
              <span className="text-purple-400">{formatRupiah(summary.totalRentalOmzet)}</span>
            </div>
            <div className="pl-4 pr-3 py-1 flex justify-between text-slate-400">
              <span className="font-sans">Kas Diterima dari Sewa:</span>
              <span className="text-emerald-400 font-semibold">{formatRupiah(summary.totalRentalCollected)}</span>
            </div>
            <div className="pl-4 pr-3 py-1 flex justify-between text-slate-400">
              <span className="font-sans">Piutang Rental (Belum Dibayar):</span>
              <span className="text-rose-400">{formatRupiah(summary.totalReceivables)}</span>
            </div>
          </div>

          {/* 2. OPERATIONAL EXPENSES (BEBAN OPERASIONAL RUTIN) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="font-sans">2. BEBAN OPERASIONAL RUTIN (OPEX)</span>
              <span className="text-amber-400">({formatRupiah(summary.operationalExpenses)})</span>
            </div>
            <div className="pl-4 pr-3 py-1 flex justify-between text-slate-400">
              <span className="font-sans">Biaya Listrik, Internet, Servis & Kebersihan:</span>
              <span className="text-slate-300">({formatRupiah(summary.operationalExpenses)})</span>
            </div>
          </div>

          {/* 3. OPERATING PROFIT (LABA OPERASIONAL) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/40 flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-white block font-sans">
                ESTIMASI LABA OPERASIONAL
              </span>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Rumus: Total Omzet Rental - Beban Operasional Rutin
              </span>
            </div>
            <span
              className={`text-xl font-bold ${
                summary.estimatedOperationalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatRupiah(summary.estimatedOperationalProfit)}
            </span>
          </div>

          {/* 4. CAPITAL EXPENDITURE (BELANJA MODAL / ALAT) */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="font-sans">3. BELANJA MODAL / INVESTASI ALAT (CAPEX)</span>
              <span className="text-purple-300">({formatRupiah(summary.capitalAssetPurchases)})</span>
            </div>
            <div className="pl-4 pr-3 py-1 flex justify-between text-slate-400">
              <span className="font-sans">Beli Konsol PS, TV, Stabilizer & Instalasi:</span>
              <span className="text-slate-300">({formatRupiah(summary.capitalAssetPurchases)})</span>
            </div>
          </div>

          {/* 5. NET CASH POSITION (SALDO KAS FISIK AKHIR) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-white block font-sans">
                SALDO KAS NYATA (CASH ON HAND)
              </span>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Rumus: Seluruh Penerimaan Kas - Seluruh Pengeluaran Kas
              </span>
            </div>
            <span className="text-xl font-bold text-emerald-400">
              {formatRupiah(summary.cashBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
