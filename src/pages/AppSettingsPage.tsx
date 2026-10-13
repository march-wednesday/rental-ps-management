// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PENGATURAN APLIKASI & KEAMANAN PIN OWNER
// General app configurations, electricity defaults, and Owner Security PIN
// ==============================================================================

import React, { useState } from 'react';
import { localEngine } from '@/lib/mockEngine';
import { getSupabaseConfigStatus } from '@/lib/supabase';
import { AppGeneralSettings } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
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
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AppSettingsPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const { ownerPin, updateOwnerPin, resetOwnerPinToDefault } = useAuth();
  const [settings, setSettings] = useState<AppGeneralSettings>(
    localEngine.getState().settings
  );
  const supabaseStatus = getSupabaseConfigStatus();

  // Change PIN Form State
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localEngine.updateSettings(settings);
    success('Pengaturan Disimpan', 'Konfigurasi aplikasi berhasil diperbarui.');
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPinInput) {
      toastError('Validasi Gagal', 'Masukkan PIN saat ini.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      toastError('Validasi Gagal', 'PIN Baru dan Konfirmasi PIN tidak cocok!');
      return;
    }
    if (!/^\d{4,6}$/.test(newPinInput)) {
      toastError('Validasi Gagal', 'PIN baru harus berupa 4 sampai 6 digit angka.');
      return;
    }

    setIsUpdatingPin(true);
    const result = await updateOwnerPin(currentPinInput, newPinInput);
    setIsUpdatingPin(false);

    if (result.success) {
      success('PIN Berhasil Diperbarui', 'PIN Owner baru telah aktif dan disimpan.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      toastError('Gagal Memperbarui PIN', result.error || 'PIN saat ini salah.');
    }
  };

  const handleResetPin = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan PIN Owner ke default: 1234?')) {
      resetOwnerPinToDefault();
      info('PIN Direset', 'PIN Owner telah dikembalikan ke bawaan: 1234');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    }
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
            Pengaturan Aplikasi & Keamanan PIN
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Informasi usaha rental, tarif PLN, proteksi PIN Owner, dan status integrasi Supabase Cloud.
          </p>
        </div>
      </div>

      {/* OWNER PIN SECURITY CONFIGURATION CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-950/20 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Keamanan & Pengaturan PIN Owner
              </h3>
              <p className="text-xs text-slate-400">
                Aplikasi dibuka dalam mode Kasir secara default. PIN ini digunakan untuk beralih ke Mode Owner.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PIN Aktif ({ownerPin.length} Digit)</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdatePin} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Ganti PIN Owner</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                PIN Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan PIN lama"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                PIN Baru (4-6 Digit Angka)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN baru (cth: 5678)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Konfirmasi PIN Baru
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ulangi PIN baru"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Sembunyikan Digit' : 'Tampilkan Digit'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetPin}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                Reset PIN ke Default (1234)
              </button>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPin}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isUpdatingPin ? 'Menyimpan...' : 'Perbarui PIN Owner'}</span>
            </button>
          </div>
        </form>
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
