// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - AUDIT LOG
// Security and operational audit trail
// ==============================================================================

import React, { useState } from 'react';
import { localEngine } from '@/lib/mockEngine';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs] = useState(localEngine.getState().auditLogs);
  const [search, setSearch] = useState('');

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.tableName.toLowerCase().includes(q) ||
      (log.actorName && log.actorName.toLowerCase().includes(q)) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Audit Keamanan & Aktivitas</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Audit Trail & Logbook Sistem
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekam jejak setiap aksi penting (mulai sewa, perpanjangan, pembayaran, void kas, dan impor Excel).
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari aksi, pengguna, atau tabel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-3">Tabel</th>
                <th className="py-3 px-3">Pengguna / Kasir</th>
                <th className="py-3 px-4">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada audit log yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {formatIndonesianDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          log.action.includes('VOID') || log.action.includes('CANCEL')
                            ? 'danger'
                            : log.action.includes('START') || log.action.includes('PAYMENT')
                            ? 'success'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-300 text-[11px]">
                      {log.tableName}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {log.actorName || log.actorEmail || 'System'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-md">
                      {log.changes ? JSON.stringify(log.changes) : '-'}
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
