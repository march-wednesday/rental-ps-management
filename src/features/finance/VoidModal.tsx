// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - VOID TRANSACTION MODAL
// Audit-tracked cancellation of financial transactions
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { financeService } from '@/services/financeService';
import { useToast } from '@/context/ToastContext';
import { useOfflineSync } from '@/context/OfflineSyncContext';
import { CashTransaction } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CashTransaction | null;
  onSuccess: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const { enqueueMutation, isOnline } = useOfflineSync();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!transaction) return null;

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reason.trim()) {
      setErrorMessage('Alasan void / pembatalan transaksi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        transactionId: transaction.id,
        reason: reason.trim(),
      };
      const res = await financeService.voidTransaction(payload);

      if (res.success) {
        enqueueMutation('VOID', payload);
        success('Transaksi Di-Void', `Transaksi ${transaction.transactionNo} telah dibatalkan.${!isOnline ? ' (Tersimpan Offline)' : ''}`);
        setReason('');
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal membatalkan transaksi.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batalkan (Void) Transaksi Kas"
      description="Transaksi yang di-void tidak akan dihapus dari riwayat, namun saldonya akan dianulir."
      maxWidth="sm"
    >
      <form onSubmit={handleVoid} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Nomor Transaksi:</span>
            <span className="font-mono text-white font-semibold">{transaction.transactionNo}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Keterangan:</span>
            <span className="text-white text-right truncate max-w-[180px]">{transaction.description}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Nominal:</span>
            <span className="font-bold text-rose-400 font-mono">{formatRupiah(transaction.amount)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Alasan Pembatalan / Void <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Contoh: Salah input nominal, transaksi ganda, refund pelanggan"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Void'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
