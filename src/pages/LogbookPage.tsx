// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - LOGBOOK HARIAN
// Complete history of all rental sessions matching sheet "Logbook Harian"
// Fully connected to Supabase Cloud & Local Database
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { rentalService } from '@/services/rentalService';
import { excelService } from '@/services/excelService';
import { useRental } from '@/context/RentalContext';
import { RentalSession } from '@/types';
import { formatRupiah, formatDuration } from '@/utils/formatters';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import {
  BookOpen,
  FileSpreadsheet,
  Search,
  Filter,
  Clock,
  RefreshCw,
  Coins,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const LogbookPage: React.FC = () => {
  const { units } = useRental();
  const [rentals, setRentals] = useState<RentalSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const loadRentals = async () => {
    setIsLoading(true);
    const data = await rentalService.getRentals(false);
    setRentals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const filtered = rentals.filter((r) => {
    if (unitFilter !== 'all' && r.unitCode !== unitFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && r.paymentStatus !== paymentFilter) return false;
    if (dateFilter !== 'all') {
      const rDate = r.startTime ? r.startTime.split('T')[0] : '';
      if (rDate !== dateFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.rentalCode.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.customerPhone && r.customerPhone.includes(q))
      );
    }
    return true;
  });

  // Calculate statistics from filtered data
  const totalSessions = filtered.length;
  const totalDurationMinutes = filtered.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
  const totalOmzet = filtered.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const totalPaid = filtered.reduce((sum, r) => sum + (r.totalPaid || 0), 0);

  // Get distinct dates for date filter
  const distinctDates = Array.from(
    new Set(
      rentals
        .map((r) => (r.startTime ? r.startTime.split('T')[0] : ''))
        .filter(Boolean)
    )
  ).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Riwayat Operasional Terhubung Database</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Logbook Harian Rental PS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Arsip lengkap sesi bermain PlayStation, durasi, status pelunasan, dan catatan kasir terhubung database Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRentals}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            title="Muat Ulang Data dari Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => excelService.exportLogbook()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Sesi Rental</span>
          <div className="text-xl font-bold text-white font-mono">{totalSessions} <span className="text-xs text-slate-400 font-normal">Sesi</span></div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Durasi Bermain</span>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {(totalDurationMinutes / 60).toFixed(1)} <span className="text-xs text-slate-400 font-normal">Jam</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Tagihan (Omzet)</span>
          <div className="text-xl font-bold text-purple-300 font-mono">{formatRupiah(totalOmzet)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Kas Diterima</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">{formatRupiah(totalPaid)}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode, nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Unit Filter - Dynamically populated from registered units */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.code}>
                {u.code} ({u.name})
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Tanggal</option>
            {distinctDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Session Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="Lunas">Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Belum Bayar">Belum Bayar / CU</option>
          </select>
        </div>
      </div>

      {/* Logbook Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Kode Rental</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-3">Durasi</th>
                <th className="py-3 px-3">Waktu Mulai</th>
                <th className="py-3 px-3">Target Selesai</th>
                <th className="py-3 px-3 text-right">Tagihan</th>
                <th className="py-3 px-3 text-right">Dibayar</th>
                <th className="py-3 px-3 text-center">Status Bayar</th>
                <th className="py-3 px-3 text-center">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    {isLoading ? 'Memuat data dari database...' : 'Belum ada riwayat rental yang sesuai dengan filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-purple-300 font-semibold">
                      {r.rentalCode}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {r.unitCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {formatDuration(r.durationMinutes)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {r.startTime ? formatIndonesianDateTime(r.startTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {r.targetEndTime ? formatIndonesianDateTime(r.targetEndTime) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                      {formatRupiah(r.totalPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      {formatRupiah(r.totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          r.paymentStatus === 'Lunas'
                            ? 'success'
                            : r.paymentStatus === 'Sebagian'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {r.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
