// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - KELOLA & TAMBAH UNIT PS MODAL
// Add, edit, and manage PlayStation consoles with instant sync to database & reports
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useRental } from '@/context/RentalContext';
import { formatRupiah } from '@/utils/formatters';
import { Badge } from '@/components/common/Badge';
import { PSUnit } from '@/types';
import {
  Gamepad2,
  Plus,
  Trash2,
  Edit2,
  Tv,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ManageUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageUnitsModal: React.FC<ManageUnitsModalProps> = ({ isOpen, onClose }) => {
  const { units, createUnit, updateUnit, deleteUnit, isSubmitting } = useRental();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Form State
  const nextCodeNum = units.length + 1;
  const suggestedCode = `PS-${String(nextCodeNum).padStart(2, '0')}`;

  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState(`PS4 Unit ${nextCodeNum}`);
  const [consoleType, setConsoleType] = useState('PS4');
  const [hourlyRate, setHourlyRate] = useState<number>(10000);
  const [status, setStatus] = useState<PSUnit['status']>('Tersedia');
  const [notes, setNotes] = useState('TV 43 inch, 2 Stik DualShock 4 Wireless');
  const [formError, setFormError] = useState('');

  const handleResetForm = () => {
    const nextNum = units.length + 1;
    setCode(`PS-${String(nextNum).padStart(2, '0')}`);
    setName(`PS4 Unit ${nextNum}`);
    setConsoleType('PS4');
    setHourlyRate(10000);
    setStatus('Tersedia');
    setNotes('TV 43 inch, 2 Stik DualShock 4 Wireless');
    setFormError('');
    setEditingUnitId(null);
  };

  const handleStartEdit = (unit: PSUnit) => {
    setEditingUnitId(unit.id);
    setCode(unit.code);
    setName(unit.name);
    setConsoleType(unit.consoleType);
    setHourlyRate(unit.hourlyRate);
    setStatus(unit.status);
    setNotes(unit.notes || '');
    setActiveTab('add');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) {
      setFormError('Kode unit tidak boleh kosong.');
      return;
    }
    if (!name.trim()) {
      setFormError('Nama unit tidak boleh kosong.');
      return;
    }

    if (editingUnitId) {
      const res = await updateUnit(editingUnitId, {
        name,
        consoleType,
        hourlyRate,
        status,
        notes,
      });
      if (res.success) {
        handleResetForm();
        setActiveTab('list');
      } else {
        setFormError(res.error || 'Gagal memperbarui unit');
      }
    } else {
      const res = await createUnit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        consoleType,
        hourlyRate,
        status,
        notes,
      });
      if (res.success) {
        handleResetForm();
        setActiveTab('list');
      } else {
        setFormError(res.error || 'Gagal menambahkan unit');
      }
    }
  };

  const handleDelete = async (unit: PSUnit) => {
    if (unit.status === 'Sedang Disewa') {
      alert('Unit sedang aktif disewa, tidak dapat dihapus.');
      return;
    }
    if (window.confirm(`Hapus unit ${unit.code} (${unit.name})?`)) {
      await deleteUnit(unit.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola & Tambah Unit PlayStation"
      description="Daftarkan konsol PS baru, perbarui tarif per jam, dan pantau status unit."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Daftar Unit Aktif ({units.length})
          </button>
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              setActiveTab('add');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'add'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingUnitId ? 'Edit Unit' : 'Tambah Unit Baru'}</span>
          </button>
        </div>

        {/* TAB 1: LIST OF UNITS */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {units.map((unit) => {
                const isAvailable = unit.status === 'Tersedia';
                const isRented = unit.status === 'Sedang Disewa';

                return (
                  <div
                    key={unit.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                          {unit.consoleType}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{unit.code}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              ({unit.name})
                            </span>
                          </div>
                          <div className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                            {formatRupiah(unit.hourlyRate)} / jam
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={isAvailable ? 'success' : isRented ? 'purple' : 'warning'}
                        size="sm"
                      >
                        {unit.status}
                      </Badge>
                    </div>

                    {unit.notes && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        {unit.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(unit)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-purple-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={isRented}
                        onClick={() => handleDelete(unit)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isRented ? 'Sedang disewa, tidak bisa dihapus' : 'Hapus Unit'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('add');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit PS Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ADD / EDIT UNIT FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kode Unit <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  disabled={Boolean(editingUnitId)}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: PS-03"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500 disabled:opacity-60"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Format unik pengenal konsol (PS-01, PS-02, PS-03).
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nama Tampilan Unit <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PS5 Unit 3 VIP"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipe Konsol
                </label>
                <select
                  value={consoleType}
                  onChange={(e) => setConsoleType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="PS4">PlayStation 4 (PS4)</option>
                  <option value="PS5">PlayStation 5 (PS5)</option>
                  <option value="PS3">PlayStation 3 (PS3)</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tarif Sewa per Jam (Rp) <span className="text-purple-400">*</span>
                </label>
                <input
                  type="number"
                  step="1000"
                  min="5000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Status Operasional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Tersedia">Tersedia (Siap Sewa)</option>
                  <option value="Maintenance">Maintenance (Servis / Rusak)</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Catatan Fasilitas / Stik / TV
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: TV 50 inch 4K, 2 Stik DualSense"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingUnitId ? 'Simpan Perubahan' : 'Daftarkan Unit PS'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
