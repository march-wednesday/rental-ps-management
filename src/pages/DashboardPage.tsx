// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - DASHBOARD
// Real-time financial KPIs, active sessions, and analytics
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  Gamepad2,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Tv,
} from 'lucide-react';
import { useRental } from '@/context/RentalContext';
import { financeService } from '@/services/financeService';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { formatRupiah, formatNumber } from '@/utils/formatters';
import { formatTimeOnly, formatIndonesianDateTime } from '@/utils/dateUtils';
import { CashTransaction } from '@/types';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { units, activeRentals, timerCalculations } = useRental();
  const [financialSummary, setFinancialSummary] = useState(financeService.getSummary());
  const [recentCashTx, setRecentCashTx] = useState<CashTransaction[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      setFinancialSummary(financeService.getSummary());
      const tx = await financeService.getCashTransactions();
      setRecentCashTx(tx.transactions.slice(0, 5));
    };
    loadSummary();
  }, [activeRentals]);

  const availableCount = units.filter((u) => u.status === 'Tersedia').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <span>Executive Business Hub</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Dashboard Operasional & Keuangan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan data riil kasir rental, buku kas harian, dan utilisasi konsol PlayStation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/rental"
            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Lihat Timer ({activeRentals.length})</span>
          </Link>
          <Link
            to="/keuangan/kas"
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            <span>Buku Kas</span>
          </Link>
        </div>
      </div>

      {/* KPI STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Saldo Kas */}
        <StatCard
          title="Saldo Kas Saat Ini"
          value={formatRupiah(financialSummary.cashBalance)}
          subtitle="Total Kas Masuk - Kas Keluar"
          icon={<Wallet className="w-5 h-5" />}
          glowColor="emerald"
        />

        {/* 2. Omzet Rental */}
        <StatCard
          title="Total Omzet Rental"
          value={formatRupiah(financialSummary.totalRentalOmzet)}
          subtitle="Nilai total transaksi sewa PS"
          icon={<TrendingUp className="w-5 h-5" />}
          glowColor="purple"
        />

        {/* 3. Estimasi Laba Operasional */}
        <StatCard
          title="Estimasi Laba Operasional"
          value={formatRupiah(financialSummary.estimatedOperationalProfit)}
          subtitle="Omzet dikurangi biaya rutin"
          icon={<PiggyBank className="w-5 h-5" />}
          glowColor={financialSummary.estimatedOperationalProfit >= 0 ? 'blue' : 'rose'}
        />

        {/* 4. Kas Masuk */}
        <StatCard
          title="Penerimaan Kas (Masuk)"
          value={formatRupiah(financialSummary.totalCashIn)}
          subtitle="Uang kas yang benar-benar diterima"
          icon={<ArrowUpRight className="w-5 h-5" />}
          glowColor="emerald"
        />

        {/* 5. Biaya Operasional */}
        <StatCard
          title="Biaya Operasional Rutin"
          value={formatRupiah(financialSummary.operationalExpenses)}
          subtitle="Listrik, internet, perawatan, dll"
          icon={<ArrowDownCircle className="w-5 h-5" />}
          glowColor="amber"
        />

        {/* 6. Pembelian Aset (Capex) */}
        <StatCard
          title="Pembelian Aset / Peralatan"
          value={formatRupiah(financialSummary.capitalAssetPurchases)}
          subtitle="Investasi peralatan & alat listrik"
          icon={<Tv className="w-5 h-5" />}
          glowColor="purple"
        />

        {/* 7. Tagihan Belum Lunas (Piutang) */}
        <StatCard
          title="Tagihan Belum Lunas"
          value={formatRupiah(financialSummary.totalReceivables)}
          subtitle="Piutang sewa belum dibayar"
          icon={<AlertCircle className="w-5 h-5" />}
          glowColor={financialSummary.totalReceivables > 0 ? 'rose' : 'emerald'}
        />

        {/* 8. Ketersediaan Unit */}
        <StatCard
          title="Unit PS Tersedia"
          value={`${availableCount} dari ${units.length}`}
          subtitle={`${activeRentals.length} sesi sedang dimainkan`}
          icon={<Gamepad2 className="w-5 h-5" />}
          glowColor={availableCount > 0 ? 'emerald' : 'amber'}
        />
      </div>

      {/* MID SECTION: CHARTS / UTILIZATION BARS & ACTIVE SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sesi Sedang Berjalan (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Sesi Rental Sedang Berjalan
              </h3>
            </div>
            <Badge variant="purple" size="sm">
              {activeRentals.length} Aktif
            </Badge>
          </div>

          {activeRentals.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Semua Unit Sedang Kosong</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Unit PS-01 dan PS-02 siap disewakan kepada pelanggan baru.
              </p>
              <Link
                to="/rental"
                className="inline-block mt-3 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
              >
                Mulai Sewa Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRentals.map((rental) => {
                const calc = timerCalculations[rental.id];
                return (
                  <div
                    key={rental.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold text-xs">
                        {rental.unitCode}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{rental.customerName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mulai: {formatTimeOnly(rental.startTime)} • Tagihan: {formatRupiah(rental.totalPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Live Remaining Time Badge */}
                      <div className={`px-3 py-1.5 rounded-xl border text-center font-mono ${
                        calc?.isExpired
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : calc?.isWarning5Min
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                          : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                      }`}>
                        <div className="text-[9px] uppercase font-bold tracking-wider">
                          {calc?.isExpired ? 'Lewat Batas' : 'Sisa Waktu'}
                        </div>
                        <div className="text-sm font-extrabold">
                          {calc?.formattedText || '...'}
                        </div>
                      </div>

                      <Badge
                        variant={
                          rental.paymentStatus === 'Lunas'
                            ? 'success'
                            : rental.paymentStatus === 'Sebagian'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {rental.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FINANCIAL BALANCE METER (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Komposisi Arus Keuangan
          </h3>

          <div className="space-y-3 text-xs">
            {/* Kas Masuk Bar */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Penerimaan Kas:</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {formatRupiah(financialSummary.totalCashIn)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (financialSummary.totalCashIn /
                        Math.max(1, financialSummary.totalCashIn + financialSummary.totalCashOut)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Kas Keluar Bar */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Pengeluaran Total:</span>
                <span className="font-semibold text-rose-400 font-mono">
                  {formatRupiah(financialSummary.totalCashOut)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (financialSummary.totalCashOut /
                        Math.max(1, financialSummary.totalCashIn + financialSummary.totalCashOut)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Operasional Rutin:</span>
                <span className="text-white">{formatRupiah(financialSummary.operationalExpenses)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Beli Alat / Aset:</span>
                <span className="text-white">{formatRupiah(financialSummary.capitalAssetPurchases)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Piutang Belum Lunas:</span>
                <span className="text-amber-400">{formatRupiah(financialSummary.totalReceivables)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider block">
                Estimasi Laba Operasional
              </span>
              <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                {formatRupiah(financialSummary.estimatedOperationalProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Transaksi Buku Kas Terbaru
          </h3>
          <Link
            to="/keuangan/kas"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Lihat Semua Buku Kas →
          </Link>
        </div>

        {recentCashTx.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl">
            Belum ada transaksi kas tercatat. Transaksi pembayaran rental atau pengeluaran akan muncul di sini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">No Transaksi</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentCashTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono text-purple-300">{tx.transactionNo}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {formatIndonesianDateTime(tx.transactionDate)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{tx.categoryName}</td>
                    <td className="py-2.5 px-3 text-slate-200 truncate max-w-xs">
                      {tx.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={tx.type === 'in' ? 'success' : 'danger'} size="sm">
                        {tx.type === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={tx.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.type === 'in' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
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
