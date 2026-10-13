// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PENGELUARAN & BIAYA
// Distinguishes routine operational expenses from asset equipment purchases
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';
import { CashTransaction } from '@/types';
import { formatRupiah } from '@/utils/formatters';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { ExpenseModal } from '@/features/finance/ExpenseModal';
import { ArrowDownCircle, Plus, Search, Filter, Tv, Zap } from 'lucide-react';

export const ExpensePage: React.FC = () => {
  const [expenses, setExpenses] = useState<CashTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState<'all' | 'asset' | 'opex'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    const res = await financeService.getCashTransactions({ type: 'out' });
    setExpenses(res.transactions);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOpex = expenses
    .filter((e) => e.status !== 'void' && !e.isCapitalAsset)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCapex = expenses
    .filter((e) => e.status !== 'void' && e.isCapitalAsset)
    .reduce((sum, e) => sum + e.amount, 0);

  const filtered = expenses.filter((e) => {
    if (categoryFilter !== 'all' && e.categoryName !== categoryFilter) return false;
    if (assetFilter === 'asset' && !e.isCapitalAsset) return false;
    if (assetFilter === 'opex' && e.isCapitalAsset) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.transactionNo.toLowerCase().includes(q) ||
        (e.referenceNo && e.referenceNo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const categories = Array.from(new Set(expenses.map((e) => e.categoryName)));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            <ArrowDownCircle className="w-4 h-4 text-rose-400" />
            <span>Manajemen Pengeluaran</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Pengeluaran & Belanja Usaha
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pisahkan belanja modal peralatan/aset baru dari beban operasional rutin harian rental.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* Summary Cards: Opex vs Capex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Biaya Operasional Rutin */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Beban Operasional Rutin (Opex)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {formatRupiah(totalOpex)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Biaya listrik PLN, paket internet, stik baru, kebersihan, dan servis PS.
          </p>
        </div>

        {/* Belanja Modal / Aset */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pembelian Aset / Peralatan (Capex)
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {formatRupiah(totalCapex)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Investasi jangka panjang (unit konsol PS4/PS5, TV LED, stabilizer, kipas besar).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari pengeluaran, nomor transaksi, struk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Asset Classification Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'opex', 'asset'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAssetFilter(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  assetFilter === mode
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'all'
                  ? 'Semua'
                  : mode === 'opex'
                  ? 'Operasional Rutin'
                  : 'Aset / Peralatan'}
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

      {/* Expense Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nomor Transaksi</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-3">Klasifikasi</th>
                <th className="py-3 px-3">No Ref / Struk</th>
                <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Belum ada data pengeluaran yang dicatat.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-purple-300 font-semibold">
                      {item.transactionNo}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatIndonesianDateTime(item.transactionDate)}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{item.categoryName}</td>
                    <td className="py-3 px-4 text-white font-medium">{item.description}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${
                          item.isCapitalAsset
                            ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                            : 'bg-amber-950 text-amber-300 border-amber-700/60'
                        }`}
                      >
                        {item.isCapitalAsset ? 'Aset / Peralatan' : 'Operasional Rutin'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {item.referenceNo || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={item.status === 'void' ? 'danger' : 'success'} size="sm">
                        {item.status === 'void' ? 'VOID' : 'Valid'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
