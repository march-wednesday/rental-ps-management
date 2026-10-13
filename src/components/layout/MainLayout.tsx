// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - MAIN LAYOUT
// Desktop sidebar, mobile drawer, topbar, offline status banner, and outlet
// ==============================================================================

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { StartRentalModal } from '@/features/rental/StartRentalModal';
import { useOfflineSync } from '@/context/OfflineSyncContext';
import { X, WifiOff, RefreshCw } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [startRentalOpen, setStartRentalOpen] = useState(false);
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  return (
    <div className="flex h-screen bg-[#0a0e17] text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenStartRental={() => setStartRentalOpen(true)}
        />

        {/* OFFLINE STATUS BANNER (When phone or desktop has no internet) */}
        {!isOnline && (
          <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>Mode Offline Aktif:</strong> Tidak ada koneksi internet. Anda tetap dapat memulai sewa, menambah waktu, dan mencatat transaksi kas. Data tersimpan aman di perangkat dan akan otomatis disinkronkan saat online kembali.
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="font-mono font-bold bg-amber-900/60 px-2 py-0.5 rounded text-[11px] shrink-0">
                {pendingCount} Transaksi Mengantre
              </span>
            )}
          </div>
        )}

        {/* PENDING SYNC BANNER (When back online but has pending mutations) */}
        {isOnline && pendingCount > 0 && (
          <div className="bg-purple-950/80 border-b border-purple-500/30 px-4 py-2 text-xs text-purple-200 flex items-center justify-between gap-3 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-purple-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                Terdapat <strong>{pendingCount} transaksi offline</strong> yang siap disinkronkan ke cloud.
              </span>
            </div>
            <button
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-all shrink-0"
            >
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Start Rental Modal */}
      <StartRentalModal
        isOpen={startRentalOpen}
        onClose={() => setStartRentalOpen(false)}
      />
    </div>
  );
};
