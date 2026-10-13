// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PENGATURAN APLIKASI & SUPABASE
// General app configurations, electricity defaults, and Supabase cloud sync
// ==============================================================================

import React, { useState } from 'react';
import { localEngine } from '@/lib/mockEngine';
import { getSupabaseConfigStatus } from '@/lib/supabase';
import { AppGeneralSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Settings,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Server,
  Key,
} from 'lucide-react';

export const AppSettingsPage: React.FC = () => {
  const { success, info } = useToast();
  const [settings, setSettings] = useState<AppGeneralSettings>(
    localEngine.getState().settings
  );
  const supabaseStatus = getSupabaseConfigStatus();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localEngine.updateSettings(settings);
    success('Pengaturan Disimpan', 'Konfigurasi aplikasi berhasil diperbarui.');
  };

  const handleResetDatabase = () => {
    if (
      window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mereset database ke data awal seed (PS-01, PS-02, tarif reguler, dan inventaris)? Data transaksi kas akan dikosongkan.'
      )
    ) {
      localEngine.resetToDefault();
      setSettings(localEngine.getState().settings);
      info('Database Direset', 'Database lokal telah dikembalikan ke kondisi seed awal.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Konfigurasi Sistem</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Pengaturan Aplikasi & Database
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Informasi usaha rental, zona waktu operasional, dan status koneksi database Supabase Cloud.
          </p>
        </div>
      </div>

      {/* SUPABASE CONNECTION STATUS & CLOUD SYNC PANEL */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Status Integrasi Database Supabase
            </h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
              supabaseStatus.isConfigured
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>
              {supabaseStatus.isConfigured ? 'Supabase Live Connected' : 'Local Engine Aktif'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Endpoint Supabase:</span>
            <span className="font-mono text-white">{supabaseStatus.url}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Supabase Anon Key:</span>
            <span className="font-mono text-emerald-400">
              {supabaseStatus.hasKey ? 'Terkonfigurasi (Protected)' : 'Belum Terisi di .env'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Row Level Security (RLS):</span>
            <span className="text-purple-300 font-semibold">Tersedia di migrasi SQL</span>
          </div>
        </div>

        {!supabaseStatus.isConfigured && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Panduan Menghubungkan Supabase Cloud:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Aplikasi saat ini berjalan mulus dengan <strong>Local Reactive Engine</strong> (mendukung seluruh fitur operasional, timer, kas, transaksi, dan impor Excel). Untuk menghubungkan ke project cloud Supabase Anda:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 font-mono text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <li>Buka file <code className="text-purple-300">.env</code> di root folder proyek</li>
              <li>Isi <code className="text-emerald-300">VITE_SUPABASE_URL=https://xyz.supabase.co</code></li>
              <li>Isi <code className="text-emerald-300">VITE_SUPABASE_ANON_KEY=eyJh...</code></li>
              <li>Jalankan migrasi SQL dari folder <code className="text-cyan-300">supabase/migrations/</code> di Supabase SQL Editor</li>
            </ol>
          </div>
        )}
      </div>

      {/* GENERAL APP SETTINGS FORM */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Konfigurasi Usaha & Operasional Kasir
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nama Usaha Rental
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Zona Waktu Operasional
            </label>
            <input
              type="text"
              disabled
              value={`${settings.timezone} (WITA, UTC+8)`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mata Uang
            </label>
            <input
              type="text"
              disabled
              value={`${settings.currency} (Rupiah Indonesia)`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tarif Dasar Listrik PLN per kWh (Rp)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.electricityKwhRate}
              onChange={(e) =>
                setSettings({ ...settings, electricityKwhRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database ke Kondisi Awal</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
