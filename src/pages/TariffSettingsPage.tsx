// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PENGATURAN TARIF
// ==============================================================================

import React, { useState } from 'react';
import { rentalService } from '@/services/rentalService';
import { useRental } from '@/context/RentalContext';
import { useAuth } from '@/context/AuthContext';
import { TariffPackage } from '@/types';
import { formatRupiah, formatDuration } from '@/utils/formatters';
import { Tag, Plus, Edit, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';

export const TariffSettingsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const { tariffPackages, units, refreshData } = useRental();
  const { success, warning, error } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<TariffPackage | null>(null);
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(10000);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    if (!isOwner) {
      warning('Akses Dibatasi', 'Hanya Owner yang dapat mengubah tarif sewa.');
      return;
    }
    setEditPackage(null);
    setName('');
    setDurationMinutes(60);
    setPrice(10000);
    setModalOpen(true);
  };

  const handleOpenEdit = (pkg: TariffPackage) => {
    if (!isOwner) {
      warning('Akses Dibatasi', 'Hanya Owner yang dapat mengubah tarif sewa.');
      return;
    }
    setEditPackage(pkg);
    setName(pkg.name);
    setDurationMinutes(pkg.durationMinutes);
    setPrice(pkg.price);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editPackage) {
        const res = await rentalService.updateTariffPackage(editPackage.id, {
          name: name.trim(),
          durationMinutes,
          price,
        });
        if (res.success) {
          success('Paket Diperbarui', `${name} berhasil diubah.`);
        } else {
          error('Gagal Mengubah Paket', res.error || 'Terjadi kesalahan.');
        }
      } else {
        const res = await rentalService.createTariffPackage({
          name: name.trim(),
          durationMinutes,
          price,
        });
        if (res.success) {
          success('Paket Ditambahkan', `${name} berhasil disimpan ke database.`);
        } else {
          error('Gagal Menambah Paket', res.error || 'Terjadi kesalahan.');
        }
      }
      await refreshData();
      setModalOpen(false);
    } catch (err: any) {
      error('Kesalahan Sistem', err.message || 'Gagal menyimpan paket.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pkg: TariffPackage) => {
    if (!isOwner) return;
    if (tariffPackages.length <= 1) {
      warning('Tidak Dapat Menghapus', 'Minimal harus ada 1 paket tarif sewa yang aktif.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus paket "${pkg.name}" (${formatRupiah(pkg.price)})?`)) {
      return;
    }

    try {
      const res = await rentalService.deleteTariffPackage(pkg.id);
      if (res.success) {
        success('Paket Dihapus', `Paket "${pkg.name}" berhasil dihapus.`);
        await refreshData();
      } else {
        error('Gagal Menghapus', res.error || 'Terjadi kesalahan saat menghapus paket.');
      }
    } catch (err: any) {
      error('Kesalahan Sistem', err.message || 'Gagal menghapus paket.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4 text-purple-400" />
            <span>Katalog & Harga</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Pengaturan Tarif Sewa PlayStation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi paket durasi sewa, tarif per jam, dan promosi paket hemat yang berlaku di kasir.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket Tarif</span>
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Anda saat ini login sebagai Kasir Operator. Tarif hanya dapat diubah oleh peran Owner.
          </span>
        </div>
      )}

      {/* Grid of Tariff Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tariffPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {pkg.name}
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/60 font-mono">
                  {formatDuration(pkg.durationMinutes)}
                </span>
              </div>

              <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-3">
                {formatRupiah(pkg.price)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Tarif setara: {formatRupiah((pkg.price / pkg.durationMinutes) * 60)} / jam
              </span>
            </div>

            {isOwner && (
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => handleOpenEdit(pkg)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Edit tarif"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {tariffPackages.length > 1 && (
                  <button
                    onClick={() => handleDelete(pkg)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus paket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unit Hourly Rates Overview */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Tarif Dasar Per Unit PlayStation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {units.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-purple-400">{u.code}</span>
                <span className="text-sm font-bold text-white block mt-0.5">{u.name}</span>
                <span className="text-[11px] text-slate-400">{u.consoleType}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Tarif Per Jam</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatRupiah(u.hourlyRate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add / Edit Tariff */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPackage ? 'Edit Paket Tarif' : 'Tambah Paket Tarif Baru'}
        description="Tentukan nama paket, durasi bermain dalam menit, dan harga rupiah."
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Paket <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Paket 1 Jam, Paket Begadang"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Durasi Waktu (Menit) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="15"
              step="15"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Setara: {formatDuration(durationMinutes)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Harga Tarif (Rp) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40"
            >
              Simpan Paket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
