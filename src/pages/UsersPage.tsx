// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - MANAJEMEN PENGGUNA & HAK AKSES
// Role management, permissions matrix (Owner vs Operator)
// ==============================================================================

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { localEngine } from '@/lib/mockEngine';
import { Badge } from '@/components/common/Badge';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Users, Shield, Check, X, UserCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const profiles = localEngine.getState().profiles;

  const permissionsMatrix = [
    { feature: 'Mulai & Tambah Waktu Rental', operator: true, owner: true },
    { feature: 'Selesaikan Sesi Rental', operator: true, owner: true },
    { feature: 'Catat Kas Masuk (Pembayaran)', operator: true, owner: true },
    { feature: 'Catat Pengeluaran Operasional', operator: true, owner: true },
    { feature: 'Melihat Buku Kas Harian', operator: true, owner: true },
    { feature: 'Ekspor Data ke Excel', operator: true, owner: true },
    { feature: 'Impor File Excel', operator: true, owner: true },
    { feature: 'Koreksi / Void Transaksi Kas', operator: false, owner: true },
    { feature: 'Ubah Tarif & Paket Sewa', operator: false, owner: true },
    { feature: 'Manajemen Pengguna & Sistem', operator: false, owner: true },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Keamanan & Hak Akses</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Manajemen Pengguna & Peran
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftar akun pengguna, pembagian wewenang antara Owner dan Operator kasir, serta verifikasi hak akses.
          </p>
        </div>
      </div>

      {/* User Profiles List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Daftar Akun Pengguna Aktif
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((p) => {
            const isCurrent = user?.id === p.id || user?.role === p.role;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-base flex items-center justify-center">
                      {p.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.fullName}</span>
                        {isCurrent && (
                          <Badge variant="purple" size="sm">
                            Aktif Sekarang
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">{p.email}</span>
                    </div>
                  </div>

                  <Badge variant={p.role === 'owner' ? 'purple' : 'info'} size="sm">
                    {p.role.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Terdaftar: {formatIndonesianDateTime(p.createdAt)}</span>
                  <button
                    onClick={() => switchRole(p.role)}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Gunakan Akun Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERMISSIONS MATRIX */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Matriks Hak Akses Fitur (Role Permissions)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Fitur / Operasi Sistem</th>
                <th className="py-2.5 px-4 text-center">Operator Kasir</th>
                <th className="py-2.5 px-4 text-center">Owner (Pemilik Usaha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-200 font-medium">{item.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {item.operator ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.owner ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
