// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - START RENTAL MODAL
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useRental } from '@/context/RentalContext';
import { formatRupiah } from '@/utils/formatters';

interface StartRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUnitId?: string;
}

export const StartRentalModal: React.FC<StartRentalModalProps> = ({
  isOpen,
  onClose,
  defaultUnitId,
}) => {
  const { units, tariffPackages, startRental, isSubmitting } = useRental();

  const availableUnits = units.filter((u) => u.status === 'Tersedia');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    defaultUnitId || availableUnits[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedTariffId, setSelectedTariffId] = useState<string>(
    tariffPackages[0]?.id || ''
  );
  const [customMinutes, setCustomMinutes] = useState<number>(60);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (defaultUnitId && units.some((u) => u.id === defaultUnitId)) {
      setSelectedUnitId(defaultUnitId);
    } else if (availableUnits.length > 0 && (!selectedUnitId || !units.some(u => u.id === selectedUnitId))) {
      setSelectedUnitId(availableUnits[0].id);
    }
  }, [defaultUnitId, units]);

  // Selected tariff info
  const selectedTariff = tariffPackages.find((t) => t.id === selectedTariffId);
  const targetUnit = units.find((u) => u.id === selectedUnitId);

  const calculatedPrice = isCustomDuration
    ? ((customMinutes / 60) * (targetUnit?.hourlyRate || 10000))
    : selectedTariff?.price || 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedUnitId) {
      setErrorMessage('Silakan pilih unit PlayStation yang tersedia.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }

    const durationMinutes = isCustomDuration
      ? customMinutes
      : selectedTariff?.durationMinutes || 60;

    const res = await startRental({
      unitId: selectedUnitId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      tariffPackageId: isCustomDuration ? undefined : selectedTariffId,
      durationMinutes,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      // Reset form & close
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal memulai rental.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mulai Sesi Sewa Baru"
      description="Pilih unit dan paket sewa untuk mengaktifkan timer otomatis."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Unit Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Pilih Unit PlayStation
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            required
          >
            {units.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
                disabled={unit.status !== 'Tersedia'}
              >
                {unit.code} - {unit.name} ({unit.status})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nama Pelanggan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Andi, Rian"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nomor WhatsApp / HP (Opsional)
            </label>
            <input
              type="tel"
              placeholder="08123456789"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Tariff Package Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Paket Durasi</label>
            <button
              type="button"
              onClick={() => setIsCustomDuration(!isCustomDuration)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              {isCustomDuration ? 'Pilih Paket Standar' : 'Durasi Kustom'}
            </button>
          </div>

          {!isCustomDuration ? (
            <div className="grid grid-cols-2 gap-2">
              {tariffPackages.map((pkg) => {
                const isSelected = selectedTariffId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedTariffId(pkg.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{pkg.name}</div>
                    <div className="text-[11px] text-purple-300 font-mono mt-0.5">
                      {formatRupiah(pkg.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                min="15"
                step="15"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(15, parseInt(e.target.value) || 15))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Jumlah menit (contoh: 90)"
              />
              <span className="text-[11px] text-slate-400">
                Durasi: {Math.floor(customMinutes / 60)} Jam {customMinutes % 60} Menit
              </span>
            </div>
          )}
        </div>

        {/* Total Price Display */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Tarif Sewa:</span>
          <span className="text-base font-bold text-emerald-400 font-mono">
            {formatRupiah(calculatedPrice)}
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Main FIFA, stik tambahan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availableUnits.length === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all"
          >
            {isSubmitting ? 'Memproses...' : 'Mulai Timer Sekarang'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
