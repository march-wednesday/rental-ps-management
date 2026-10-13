// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - OWNER ROUTE GUARD
// Restricts non-owner users from viewing sensitive financial and settings pages
// ==============================================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Lock, ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';

interface OwnerRouteGuardProps {
  children: React.ReactNode;
}

export const OwnerRouteGuard: React.FC<OwnerRouteGuardProps> = ({ children }) => {
  const { isOwner, openPinModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOwner) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-950/40 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Akses Khusus Pemilik (Owner)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Halaman Ini Memerlukan PIN Owner
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anda sedang berada dalam <strong>Mode Kasir</strong>. Akses kasir dibatasi hanya untuk operasional <strong>Daftar Sewa</strong>. Masukkan PIN Owner untuk membuka halaman ini.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
            <button
              onClick={() => openPinModal(location.pathname)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/50 transition-all hover:scale-105 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Buka dengan PIN</span>
            </button>
            <button
              onClick={() => navigate('/rental')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Sewa</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
