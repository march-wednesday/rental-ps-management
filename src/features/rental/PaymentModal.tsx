// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - PAYMENT MODAL
// Multi-method payment recorder with atomic Cash Book (Kas Masuk) sync
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useRental } from '@/context/RentalContext';
import { RentalSession, PaymentMethod } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: RentalSession | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  rental,
}) => {
  const { recordPayment, isSubmitting } = useRental();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!rental) return null;

  const remainingDue = rental.totalPrice - rental.totalPaid;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (amount > remainingDue) {
      setErrorMessage(`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(remainingDue)}).`);
      return;
    }

    const res = await recordPayment({
      rentalId: rental.id,
      amount,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal memproses pembayaran.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pembayaran Sewa"
      description={`Unit: ${rental.unitName} | Pelanggan: ${rental.customerName}`}
      maxWidth="md"
    >
      <form onSubmit={handlePay} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Billing Overview Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Tagihan</span>
            <span className="font-semibold text-white font-mono mt-0.5 block">
              {formatRupiah(rental.totalPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Sudah Dibayar</span>
            <span className="font-semibold text-emerald-400 font-mono mt-0.5 block">
              {formatRupiah(rental.totalPaid)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Sisa Tagihan</span>
            <span className="font-bold text-rose-400 font-mono mt-0.5 block">
              {formatRupiah(remainingDue)}
            </span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Pilih Nominal Cepat
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAmount(remainingDue)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
            >
              Bayar Lunas ({formatRupiah(remainingDue)})
            </button>
            {remainingDue > 10000 && (
              <button
                type="button"
                onClick={() => setAmount(10000)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-all"
              >
                Rp 10.000
              </button>
            )}
            {remainingDue > 20000 && (
              <button
                type="button"
                onClick={() => setAmount(20000)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-all"
              >
                Rp 20.000
              </button>
            )}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nominal yang Diterima (Rp) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1000"
            max={remainingDue}
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['Tunai', 'QRIS', 'Transfer', 'Lainnya'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all ${
                  paymentMethod === method
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Catatan Bukti / Keterangan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Tunai pas, QRIS BCA"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Terima Pembayaran'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
