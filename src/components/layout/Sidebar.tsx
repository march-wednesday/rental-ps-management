// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - SIDEBAR NAVIGATION
// Dark Gaming Business Theme with all 12 required routes
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
  UserCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/common/Badge';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, role, switchRole, isSupabaseConnected } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const navigationGroups = [
    {
      group: 'Operasional Utama',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Penyewaan PS', path: '/rental', icon: Clock, badge: 'Live' },
        { name: 'Logbook Harian', path: '/logbook', icon: BookOpen },
      ],
    },
    {
      group: 'Keuangan & Kas',
      items: [
        { name: 'Buku Kas', path: '/keuangan/kas', icon: Wallet },
        { name: 'Pengeluaran', path: '/keuangan/pengeluaran', icon: ArrowDownCircle },
        { name: 'Laporan Keuangan', path: '/laporan', icon: BarChart3 },
      ],
    },
    {
      group: 'Data & Peralatan',
      items: [
        { name: 'Inventaris & Listrik', path: '/inventaris', icon: Zap },
        { name: 'Impor / Ekspor Excel', path: '/excel', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'Konfigurasi & Sistem',
      items: [
        { name: 'Pengaturan Tarif', path: '/pengaturan/tarif', icon: Tag },
        { name: 'Pengaturan Aplikasi', path: '/pengaturan/aplikasi', icon: Settings },
        { name: 'Manajemen Pengguna', path: '/pengguna', icon: Users },
        { name: 'Audit Log', path: '/audit-log', icon: ShieldCheck },
      ],
    },
  ];

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

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </h2>
            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-md shadow-purple-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="purple" size="sm" dot>
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info: Supabase Status & Active Role */}
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

        {/* User Card & Role Switcher */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 capitalize">{role}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
            <button
              onClick={() => switchRole(role === 'owner' ? 'operator' : 'owner')}
              title="Klik untuk ganti peran Owner / Operator (Uji Hak Akses)"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-purple-300 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
