// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - EXTEND RENTAL MODAL (Tambah Waktu)
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useRental } from '@/context/RentalContext';
import { RentalSession } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface ExtendRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalSession | null;
}

export const ExtendRentalModal: React.FC<ExtendRentalModalProps> = ({
  isOpen,
  onClose,
  rental,
}) => {
  const { extendRental, isSubmitting } = useRental();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState('');

  if (!rental) return null;

  // Rate per 60 min is Rp 10.000 (10000 / 60 = ~166.67/min)
  const additionalPrice = (selectedMinutes / 60) * 10000;

  const handleExtend = async () => {
    setErrorMessage('');
    const res = await extendRental({
      rentalId: rental.id,
      additionalMinutes: selectedMinutes,
      additionalPrice,
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal memperpanjang sewa.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tambah Waktu: ${rental.unitName}`}
      description={`Pelanggan: ${rental.customerName} (${rental.rentalCode})`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="text-xs text-slate-400">
          Pilih durasi tambahan waktu yang diinginkan:
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '+30 Menit', minutes: 30 },
            { label: '+1 Jam', minutes: 60 },
            { label: '+2 Jam', minutes: 120 },
          ].map((opt) => (
            <button
              key={opt.minutes}
              type="button"
              onClick={() => setSelectedMinutes(opt.minutes)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedMinutes === opt.minutes
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{opt.label}</div>
              <div className="text-[10px] text-purple-300 mt-0.5">
                {formatRupiah((opt.minutes / 60) * 10000)}
              </div>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Biaya Tambahan:</span>
            <span className="font-semibold text-white">{formatRupiah(additionalPrice)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Total Tagihan Baru:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {formatRupiah(rental.totalPrice + additionalPrice)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExtend}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40"
          >
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Tambah Waktu'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
