// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - BUKU KAS HARIAN
// Matching structure with Excel sheet "Buku Kas Harian"
// Kolom: Nomor, Tanggal, Nomor Referensi, Keterangan, Kas Masuk, Kas Keluar, Saldo
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';
import { excelService } from '@/services/excelService';
import { useAuth } from '@/context/AuthContext';
import { CashTransaction } from '@/types';
import { formatRupiah } from '@/utils/formatters';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { ExpenseModal } from '@/features/finance/ExpenseModal';
import { VoidModal } from '@/features/finance/VoidModal';
import {
  Wallet,
  ArrowDownCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Ban,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const CashBookPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [voidTargetTx, setVoidTargetTx] = useState<CashTransaction | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const res = await financeService.getCashTransactions({
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      search: search.trim() || undefined,
    });
    setTransactions(res.transactions);
    setCurrentBalance(res.currentBalance);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, categoryFilter, search]);

  const categories = Array.from(new Set(transactions.map((t) => t.categoryName)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Keuangan & Pembukuan</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Buku Kas Harian
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan kas masuk otomatis dari sewa dan kas keluar operasional dengan saldo berjalan real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Catat Kas Keluar</span>
          </button>

          <button
            onClick={() => excelService.exportCashBook()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
            title="Download file Excel Buku Kas Harian"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Saldo Running Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            Saldo Kas Berjalan (Kas di Tangan)
          </span>
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight mt-1 block">
            {formatRupiah(currentBalance)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            *Transaksi void atau dibatalkan otomatis tidak dihitung dalam saldo berjalan.
          </span>
        </div>

        {/* Permission Notice */}
        {!isOwner && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Peran: Operator (Hanya Owner yang dapat melakukan Void pembatalan)</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor transaksi, keterangan, no ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'in', 'out'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Tanggal & Waktu</th>
                <th className="py-3 px-3">No Referensi</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right">Kas Masuk (Rp)</th>
                <th className="py-3 px-3 text-right">Kas Keluar (Rp)</th>
                <th className="py-3 px-3 text-right">Saldo (Rp)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Belum ada transaksi kas yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  const isVoid = tx.status === 'void';
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isVoid ? 'opacity-40 bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {formatIndonesianDateTime(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-3 font-mono text-purple-300 text-[11px]">
                        {tx.referenceNo || tx.transactionNo}
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div className="font-medium">{tx.description}</div>
                        {isVoid && tx.voidReason && (
                          <div className="text-[10px] text-rose-400 italic mt-0.5">
                            Alasan Void: {tx.voidReason}
                          </div>
                        )}
                        {tx.isCapitalAsset && (
                          <span className="inline-block text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded mt-0.5">
                            Aset / Modal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{tx.categoryName}</td>

                      {/* Kas Masuk */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        {tx.type === 'in' && !isVoid ? formatRupiah(tx.amount) : '-'}
                      </td>

                      {/* Kas Keluar */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400">
                        {tx.type === 'out' && !isVoid ? formatRupiah(tx.amount) : '-'}
                      </td>

                      {/* Saldo Berjalan */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {!isVoid && tx.balanceAfter !== undefined
                          ? formatRupiah(tx.balanceAfter)
                          : '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isVoid ? 'danger' : 'success'} size="sm">
                          {isVoid ? 'VOID' : 'Valid'}
                        </Badge>
                      </td>

                      {/* Action (Void) */}
                      <td className="py-3 px-3 text-center">
                        {!isVoid && (
                          <button
                            onClick={() => setVoidTargetTx(tx)}
                            disabled={!isOwner}
                            title={
                              isOwner
                                ? 'Batalkan / Void transaksi ini'
                                : 'Hanya Owner yang memiliki hak akses Void'
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isOwner
                                ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                : 'border-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Void Modal */}
      <VoidModal
        isOpen={Boolean(voidTargetTx)}
        onClose={() => setVoidTargetTx(null)}
        transaction={voidTargetTx}
        onSuccess={loadData}
      />
    </div>
  );
};
