// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - TOPBAR
// Live WITA Clock, Theme Switcher (Dark/Light), Offline & Sync Monitor
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Clock as ClockIcon,
  Shield,
  LogOut,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  Crown,
  Lock,
  Download,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRental } from '@/context/RentalContext';
import { useTheme } from '@/context/ThemeContext';
import { useOfflineSync } from '@/context/OfflineSyncContext';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenStartRental: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onOpenStartRental,
}) => {
  const { user, role, isOwner, openPinModal, lockToCashier, logout } = useAuth();
  const { activeRentals, units } = useRental();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();
  const [currentWitaTime, setCurrentWitaTime] = useState<string>(formatIndonesianDateTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWitaTime(formatIndonesianDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableUnits = units.filter((u) => u.status === 'Tersedia').length;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left Section: Mobile Toggle, Clock, Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live WITA Clock Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ClockIcon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="font-mono font-medium">{currentWitaTime}</span>
        </div>

        {/* Unit Status Pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Badge variant={availableUnits > 0 ? 'success' : 'warning'} size="sm" dot>
            {availableUnits} Unit Tersedia
          </Badge>
          <Badge variant="purple" size="sm">
            {activeRentals.length} Sesi Aktif
          </Badge>
        </div>
      </div>

      {/* Right Section: Sync Status, Theme Toggle, Fast Action, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Offline / Online / Sync Status Pill */}
        {!isOnline ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium"
            title="Tidak ada jaringan internet. Data disimpan di HP/komputer dan akan disinkronkan saat online."
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="text-[11px]">Mode Offline</span>
          </div>
        ) : pendingCount > 0 ? (
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all"
            title="Ada data offline yang menunggu sinkronisasi ke cloud. Klik untuk sync sekarang."
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">{isSyncing ? 'Sinkronisasi...' : `Sync (${pendingCount})`}</span>
          </button>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
            title="Terhubung ke internet dan tersinkronisasi."
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Online</span>
          </div>
        )}

        {/* THEME TOGGLE BUTTON (Mode Terang / Gelap) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600" />
          )}
        </button>

        {/* PWA INSTALL BUTTON (Pasang Aplikasi) */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-pwa-install'))}
          title="Pasang / Install Aplikasi ke Layar Utama (HP / PC)"
          className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 bg-slate-900 border border-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Fast "Mulai Sewa" Button */}
        <button
          onClick={onOpenStartRental}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Mulai Sewa</span>
        </button>

        {/* Role Pill & Owner PIN Switcher */}
        {!isOwner ? (
          <button
            onClick={() => openPinModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Klik untuk membuka Mode Owner dengan PIN"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Masuk Owner</span>
          </button>
        ) : (
          <button
            onClick={lockToCashier}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Klik untuk mengunci kembali ke Mode Kasir"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Kunci Kasir</span>
          </button>
        )}

        {/* Current Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {isOwner ? (
            <>
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 text-[11px] font-semibold">Owner</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-[11px] font-semibold">Kasir</span>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Keluar / Reset ke Kasir"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
