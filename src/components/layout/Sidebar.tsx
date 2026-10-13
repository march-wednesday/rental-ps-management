// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - SIDEBAR NAVIGATION
// Role-aware navigation: Restricts Cashier to 'Daftar Sewa', PIN-locks Owner routes
// ==============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Gamepad2,
  LayoutDashboard,
  Clock,
  BookOpen,
  Wallet,
  ArrowDownCircle,
  BarChart3,
  Zap,
  FileSpreadsheet,
  Tag,
  Settings,
  Users,
  ShieldCheck,
  Radio,
  Lock,
  KeyRound,
  Crown,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/common/Badge';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, isOwner, openPinModal, lockToCashier, isSupabaseConnected } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const navigationGroups = [
    {
      group: 'Operasional Utama',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, ownerOnly: true },
        { name: 'Penyewaan PS', path: '/rental', icon: Clock, badge: 'Live', ownerOnly: false },
        { name: 'Logbook Harian', path: '/logbook', icon: BookOpen, ownerOnly: true },
      ],
    },
    {
      group: 'Keuangan & Kas',
      items: [
        { name: 'Buku Kas', path: '/keuangan/kas', icon: Wallet, ownerOnly: true },
        { name: 'Pengeluaran', path: '/keuangan/pengeluaran', icon: ArrowDownCircle, ownerOnly: true },
        { name: 'Laporan Keuangan', path: '/laporan', icon: BarChart3, ownerOnly: true },
      ],
    },
    {
      group: 'Data & Peralatan',
      items: [
        { name: 'Inventaris & Listrik', path: '/inventaris', icon: Zap, ownerOnly: true },
        { name: 'Impor / Ekspor Excel', path: '/excel', icon: FileSpreadsheet, ownerOnly: true },
      ],
    },
    {
      group: 'Konfigurasi & Sistem',
      items: [
        { name: 'Pengaturan Tarif', path: '/pengaturan/tarif', icon: Tag, ownerOnly: true },
        { name: 'Pengaturan Aplikasi', path: '/pengaturan/aplikasi', icon: Settings, ownerOnly: true },
        { name: 'Manajemen Pengguna', path: '/pengguna', icon: Users, ownerOnly: true },
        { name: 'Audit Log', path: '/audit-log', icon: ShieldCheck, ownerOnly: true },
      ],
    },
  ];

  const handleNavClick = (e: React.MouseEvent, path: string, isOwnerOnly: boolean) => {
    if (!isOwner && isOwnerOnly) {
      e.preventDefault();
      if (onCloseMobile) onCloseMobile();
      openPinModal(path);
    } else {
      if (onCloseMobile) onCloseMobile();
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-none">
              Rental <span className="text-purple-400">PS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Role State Banner */}
      {!isOwner ? (
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Mode Kasir Aktif</span>
            </div>
            <Badge variant="success" size="sm">Hanya Sewa</Badge>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Akses kasir dibatasi ke <strong>Daftar Sewa</strong>.
          </p>
          <button
            onClick={() => openPinModal()}
            className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Buka Mode Owner (PIN)</span>
          </button>
        </div>
      ) : (
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>Mode Owner</span>
            </div>
            <Badge variant="purple" size="sm">Akses Penuh</Badge>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Semua laporan, keuangan, dan pengaturan terbuka.
          </p>
          <button
            onClick={lockToCashier}
            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
            title="Kunci kembali ke mode kasir"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kunci ke Mode Kasir</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </h2>
            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isLocked = !isOwner && item.ownerOnly;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item.path, !!item.ownerOnly)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive && !isLocked
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-md shadow-purple-950/20'
                          : isLocked
                          ? 'text-slate-500 hover:text-purple-300 hover:bg-slate-900/50 cursor-pointer'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isLocked ? 'text-slate-600' : ''}`} />
                      <span className={isLocked ? 'opacity-70' : ''}>{item.name}</span>
                    </div>

                    {isLocked ? (
                      <span title="Terkunci: Masukkan PIN Owner untuk membuka">
                        <Lock className="w-3.5 h-3.5 text-slate-500 hover:text-purple-400" />
                      </span>
                    ) : (
                      item.badge && (
                        <Badge variant="purple" size="sm" dot>
                          {item.badge}
                        </Badge>
                      )
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info: Supabase Status & Active User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        {/* Supabase status badge */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Radio className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
            <span>{isSupabaseConnected ? 'Supabase Cloud' : 'Local Engine Ready'}</span>
          </div>
          <Badge variant={isSupabaseConnected ? 'success' : 'info'} size="sm">
            {isSupabaseConnected ? 'Terkoneksi' : 'Siap Sinkron'}
          </Badge>
        </div>

        {/* User Card & PIN Lock Action */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isOwner
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            }`}>
              {isOwner ? 'O' : 'K'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
              <div className={`text-[10px] capitalize font-medium ${isOwner ? 'text-purple-400' : 'text-emerald-400'}`}>
                {isOwner ? 'Owner (Pemilik)' : 'Kasir Operasional'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
            {!isOwner ? (
              <button
                onClick={() => openPinModal()}
                title="Beralih ke Owner (Masukkan PIN)"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={lockToCashier}
                title="Kunci kembali ke mode Kasir"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
