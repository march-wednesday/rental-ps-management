// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - LOGBOOK HARIAN
// Complete history of all rental sessions matching sheet "Logbook Harian"
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { rentalService } from '@/services/rentalService';
import { excelService } from '@/services/excelService';
import { RentalSession } from '@/types';
import { formatRupiah, formatDuration } from '@/utils/formatters';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { BookOpen, FileSpreadsheet, Search, Filter, Clock } from 'lucide-react';

export const LogbookPage: React.FC = () => {
  const [rentals, setRentals] = useState<RentalSession[]>([]);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    const loadRentals = async () => {
      const data = await rentalService.getRentals(false);
      setRentals(data);
    };
    loadRentals();
  }, []);

  const filtered = rentals.filter((r) => {
    if (unitFilter !== 'all' && r.unitCode !== unitFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && r.paymentStatus !== paymentFilter) return false;
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Riwayat Operasional</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Logbook Harian Rental PS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Arsip lengkap sesi bermain PlayStation, durasi, status pelunasan, dan catatan kasir.
          </p>
        </div>

        <button
          onClick={() => excelService.exportLogbook()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Ekspor Excel Logbook</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode rental, nama pelanggan, telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Unit</option>
            <option value="PS-01">PS-01 (Unit 1)</option>
            <option value="PS-02">PS-02 (Unit 2)</option>
          </select>

          {/* Session Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Semua Status Rental</option>
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
            <option value="Belum Bayar">Belum Bayar</option>
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
                <th className="py-3 px-3 text-center">Status Rental</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Belum ada riwayat rental yang sesuai dengan filter.
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
                    <td className="py-3 px-4 text-white font-medium">
                      {r.customerName}
                      {r.customerPhone && (
                        <span className="text-slate-400 block text-[10px]">{r.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {formatDuration(r.durationMinutes)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatIndonesianDateTime(r.startTime)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatIndonesianDateTime(r.targetEndTime)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-white">
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
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          r.status === 'active'
                            ? 'purple'
                            : r.status === 'completed'
                            ? 'success'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {r.status === 'active' ? 'Berjalan' : r.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </Badge>
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
